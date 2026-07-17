import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {EntityManager, Repository} from 'typeorm';
import {Client} from '../entity/client.entity';
import {TenantService} from './tenant.service';
import {Action} from '../casl/actions.enum';
import {SubjectEnum} from '../entity/subjectEnum';
import {randomBytes, randomUUID, scryptSync, timingSafeEqual} from 'crypto';
import {Permission} from '../auth/auth.decorator';
import {App} from '../entity/app.entity';
import {Tenant} from '../entity/tenant.entity';
import {AmbiguousClientIdException} from '../exceptions/ambiguous-client-id.exception';
import {OAuthException} from '../exceptions/oauth-exception';

export interface CreateAppClientInput {
    tenant: Tenant;
    alias: string;
    name: string;
    appUrl: string;
}

@Injectable()
export class ClientService {
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        @InjectRepository(App)
        private readonly appRepository: Repository<App>,
        private readonly tenantService: TenantService,
    ) {
    }

    async createAppClient(manager: EntityManager, input: CreateAppClientInput): Promise<Client> {
        const client = manager.create(Client, {
            clientId: randomUUID(),
            alias: input.alias,
            name: input.name,
            tenantId: input.tenant.id,
            isPublic: true,
            tokenEndpointAuthMethod: 'none',
            grantTypes: 'authorization_code',
            responseTypes: 'code',
            allowedScopes: 'openid profile email',
            allowPasswordGrant: false,
            allowRefreshToken: true,
            requirePkce: true,
            redirectUris: [input.appUrl],
            clientSecrets: [],
        });
        return manager.save(client);
    }

    async updateAppClientName(manager: EntityManager, clientId: string, newName: string): Promise<void> {
        await manager.update(Client, clientId, {name: newName});
    }

    async replaceSeededRedirectUri(manager: EntityManager, clientId: string, oldAppUrl: string, newAppUrl: string): Promise<void> {
        const client = await manager.findOneOrFail(Client, {where: {id: clientId}});
        const uris = client.redirectUris || [];
        const idx = uris.indexOf(oldAppUrl);
        if (idx !== -1) {
            uris[idx] = newAppUrl;
        } else {
            uris.push(newAppUrl);
        }
        await manager.update(Client, clientId, {redirectUris: uris});
    }

    async deleteAppClient(manager: EntityManager, clientId: string): Promise<void> {
        await manager.delete(Client, clientId);
    }

    async assertNotAppClientForDirectDeletion(clientId: string): Promise<void> {
        const app = await this.appRepository.findOne({where: {client: {id: clientId}}});
        if (app) {
            throw new BadRequestException('Cannot delete App_Client directly. Delete the App instead.');
        }
    }

    async isAppClient(clientId: string): Promise<boolean> {
        const app = await this.appRepository.findOne({where: {client: {id: clientId}}});
        return !!app;
    }

    assertNotDefaultClientForAppLinkage(client: Client, linkedAppId: string | null): void {
        if (!linkedAppId) {
            const appsCount = 0;
            if (appsCount === 0) {
                throw new BadRequestException('Default_Clients cannot be linked to Apps');
            }
        }
    }

    async createClient(
        permission: Permission,
        tenantId: string,
        name: string,
        redirectUris: string[],
        alias: string,
        allowedScopes?: string,
        grantTypes?: string,
        responseTypes?: string,
        tokenEndpointAuthMethod?: string,
        isPublic?: boolean,
        requirePkce?: boolean,
        allowPasswordGrant?: boolean,
        allowRefreshToken?: boolean,
        allowedResources?: string[],
    ): Promise<{ client: Client; plainSecret: string | null }> {
        permission.isAuthorized(Action.Create, SubjectEnum.CLIENT, {tenantId});

        const tenant = await this.tenantService.findById(permission, tenantId);
        const clientId = randomUUID();

        let clientSecrets: { secret: string; salt: string; created_at: string; expires_at: string | null }[] = [];
        let plainSecret: string | null = null;

        if (!isPublic) {
            const generated = this.generateSecret();
            plainSecret = generated.plainSecret;
            clientSecrets = [{
                secret: generated.hashedSecret,
                salt: generated.salt,
                created_at: new Date().toISOString(),
                expires_at: null,
            }];
        }

        const fullAlias = `${tenant.domain}.${alias}`;
        if (fullAlias.length > 253) {
            throw new BadRequestException('Client alias exceeds 253-character limit');
        }

        const existingAlias = await this.clientRepository.findOne({where: {alias: fullAlias}});
        if (existingAlias) {
            throw new ConflictException('Client alias already in use');
        }

        const client = this.clientRepository.create({
            clientId,
            alias: fullAlias,
            clientSecrets,
            redirectUris: redirectUris || [],
            allowedScopes: allowedScopes || '',
            grantTypes: grantTypes || 'authorization_code',
            responseTypes: responseTypes || 'code',
            tokenEndpointAuthMethod: tokenEndpointAuthMethod || 'client_secret_basic',
            isPublic: isPublic || false,
            requirePkce: requirePkce || false,
            allowPasswordGrant: allowPasswordGrant || false,
            allowRefreshToken: allowRefreshToken !== undefined ? allowRefreshToken : true,
            name,
            tenant,
            allowedResources: allowedResources || null,
        });

        const saved = await this.clientRepository.save(client);
        return {client: saved, plainSecret};
    }

    async findByClientId(clientId: string): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: {clientId},
            relations: ['tenant'],
        });
        if (!client) {
            throw new NotFoundException(`Client with clientId ${clientId} not found`);
        }
        return client;
    }

    async findByAlias(alias: string): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: {alias},
            relations: ['tenant'],
        });
        if (!client) {
            throw new NotFoundException(`Client with alias ${alias} not found`);
        }
        return client;
    }

    async findByClientIdOrAlias(value: string): Promise<Client> {
        const byUuid = await this.clientRepository.findOne({
            where: {clientId: value},
            relations: ['tenant'],
        });
        const byAlias = await this.clientRepository.findOne({
            where: {alias: value},
            relations: ['tenant'],
        });

        if (byUuid && byAlias && byUuid.id !== byAlias.id) {
            // Req 8.7: a value that matches both a Default_Client UUID and an App_Client alias
            // (or vice-versa) is ambiguous — signal this distinctly so the authorize endpoint
            // can return error: invalid_request rather than unauthorized_client.
            throw new AmbiguousClientIdException(value);
        }

        if (byUuid) return byUuid;
        if (byAlias) return byAlias;
        throw new NotFoundException(`Client with clientId or alias ${value} not found`);
    }

    async createDefaultClient(tenantId: string, domain: string): Promise<Client> {
        const client = this.clientRepository.create({
            clientId: randomUUID(),
            alias: domain,
            isPublic: true,
            allowPasswordGrant: false,
            allowedScopes: 'openid profile email',
            name: 'Default Client',
            redirectUris: [],
            grantTypes: 'authorization_code',
            responseTypes: 'code',
            tokenEndpointAuthMethod: 'none',
            requirePkce: false,
            allowRefreshToken: true,
            clientSecrets: [],
            tenantId,
        });
        return this.clientRepository.save(client);
    }

    async findByTenantId(tenantId: string): Promise<Client[]> {
        return this.clientRepository.find({
            where: {tenant: {id: tenantId}},
            relations: ['tenant'],
        });
    }

    /**
     * Validates that a post_logout_redirect_uri matches one of the client's registered redirect URIs.
     * Per OIDC RP-Initiated Logout 1.0 §2.6, the OP MUST verify the URI against the client's registration.
     */
    validatePostLogoutRedirectUri(client: Client, uri: string): void {
        const registeredUris = client.redirectUris || [];
        if (registeredUris.length === 0 || !registeredUris.includes(uri)) {
            throw OAuthException.invalidRequest(
                'The post_logout_redirect_uri does not match any registered redirect URI',
            );
        }
    }

    /**
     * Validate a client secret against the client's stored secrets.
     *
     * Public clients hold no secret and cannot authenticate this way, so they
     * are rejected. Callers that intentionally allow public clients must check
     * isPublic themselves — this must never report success for a caller that
     * did not prove possession of a secret.
     */
    validateClientSecret(client: Client, secret: string): boolean {
        if (client.isPublic || !secret) {
            return false;
        }
        if (!client.clientSecrets || client.clientSecrets.length === 0) {
            return false;
        }
        const now = new Date();
        for (const entry of client.clientSecrets) {
            if (entry.expires_at && new Date(entry.expires_at) < now) {
                continue;
            }
            const buffer = scryptSync(secret, entry.salt, 64) as Buffer;
            if (timingSafeEqual(Buffer.from(entry.secret, 'hex'), buffer)) {
                return true;
            }
        }
        return false;
    }

    async rotateSecret(clientId: string): Promise<{ client: Client; plainSecret: string }> {
        const client = await this.findByClientId(clientId);

        // Convert public client to confidential on first secret generation
        if (client.isPublic) {
            client.isPublic = false;
            client.tokenEndpointAuthMethod = 'client_secret_basic';
        }

        const generated = this.generateSecret();

        // Set expiry on existing non-expired secrets (24h overlap window)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        if (client.clientSecrets) {
            for (const entry of client.clientSecrets) {
                if (!entry.expires_at) {
                    entry.expires_at = expiresAt;
                }
            }
        }

        const newEntry = {
            secret: generated.hashedSecret,
            salt: generated.salt,
            created_at: now.toISOString(),
            expires_at: null,
        };

        client.clientSecrets = [...(client.clientSecrets || []), newEntry];
        const saved = await this.clientRepository.save(client);
        return {client: saved, plainSecret: generated.plainSecret};
    }

    async updateClient(
        permission: Permission,
        clientId: string,
        updates: {
            name?: string;
            alias?: string;
            redirectUris?: string[];
            requirePkce?: boolean;
            allowPasswordGrant?: boolean;
            allowRefreshToken?: boolean;
        },
    ): Promise<Client> {
        const client = await this.findByClientId(clientId);
        permission.isAuthorized(Action.Update, SubjectEnum.CLIENT, {tenantId: client.tenantId});

        const appClientLinked = await this.isAppClient(client.id);

        // Req 7.6: App_Client alias is immutable (derived from App name at creation)
        if (appClientLinked && updates.alias !== undefined) {
            throw new BadRequestException(
                'Field is immutable for App_Clients: alias (derived from App name at creation)',
            );
        }

        // Req 7.7: For App_Clients, name is a cascade-driven field (synced via
        // AppService.updateApp) and must not be changed directly through the Client API.
        if (appClientLinked && updates.name !== undefined) {
            throw new BadRequestException(
                'Field is immutable for App_Clients: name (updated automatically when the App is renamed)',
            );
        }

        if (updates.name !== undefined) client.name = updates.name;
        if (updates.redirectUris !== undefined) client.redirectUris = updates.redirectUris;
        if (updates.requirePkce !== undefined) client.requirePkce = updates.requirePkce;
        if (updates.allowPasswordGrant !== undefined) client.allowPasswordGrant = updates.allowPasswordGrant;
        if (updates.allowRefreshToken !== undefined) client.allowRefreshToken = updates.allowRefreshToken;
        if (updates.alias !== undefined) client.alias = updates.alias;
        return this.clientRepository.save(client);
    }

    async deleteClient(permission: Permission, clientId: string): Promise<void> {
        const client = await this.findByClientId(clientId);
        permission.isAuthorized(Action.Delete, SubjectEnum.CLIENT, {tenantId: client.tenantId});
        await this.assertNotAppClientForDirectDeletion(client.id);
        await this.clientRepository.remove(client);
    }

    private generateSecret(): { plainSecret: string; hashedSecret: string; salt: string } {
        const plainSecret = randomBytes(32).toString('hex');
        const salt = randomBytes(8).toString('hex');
        const buffer = scryptSync(plainSecret, salt, 64) as Buffer;
        return {plainSecret, hashedSecret: buffer.toString('hex'), salt};
    }
}
