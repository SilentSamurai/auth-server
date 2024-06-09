import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '../config/config.service';
import {UsersService} from '../users/users.service';
import {JwtService} from '@nestjs/jwt';
import {User} from '../users/user.entity';
import {UserNotFoundException} from '../exceptions/user-not-found.exception';
import {InvalidCredentialsException} from '../exceptions/invalid-credentials.exception';
import {EmailNotVerifiedException} from '../exceptions/email-not-verified.exception';
import {InvalidTokenException} from '../exceptions/invalid-token.exception';
import * as argon2 from 'argon2';
import {Tenant} from "../tenants/tenant.entity";
import {TenantService} from "../tenants/tenant.service";
import {CryptUtil} from "../util/crypt.util";
import {GRANT_TYPES, SecurityContext} from "../scopes/security.service";
import {UnauthorizedException} from "../exceptions/unauthorized.exception";
import {RoleEnum} from "../scopes/roleEnum";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";


@Injectable()
export class AuthService {

    private readonly LOGGER = new Logger("AuthService");

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService,
        private readonly jwtService: JwtService
    ) {
    }

    /**
     * Validate the email and password.
     */
    async validate(email: string, password: string): Promise<User> {
        const user: User = await this.usersService.findByEmail(email);
        const valid: boolean = await argon2.verify(user.password, password);
        if (!valid) {
            throw new InvalidCredentialsException();
        }
        return user;
    }

    async validateRefreshToken(refreshToken: string) {
        let validationPipe = new ValidationPipe(ValidationSchema.RefreshTokenSchema);
        let payload = await validationPipe.transform(
            this.jwtService.decode(refreshToken, {json: true}),
            null) as { email, domain };

        let tenant = await this.tenantService.findByDomain(payload.domain);
        let user = await this.usersService.findByEmail(payload.email);
        await this.jwtService
            .verifyAsync(refreshToken, {publicKey: tenant.publicKey});
        return {tenant, user};
    }

    async validateAccessToken(token: string): Promise<SecurityContext> {
        try {
            let validationPipe = new ValidationPipe(ValidationSchema.SecurityContextSchema);
            let payload: SecurityContext = await validationPipe.transform(
                this.jwtService.decode(token, {json: true}),
                null) as SecurityContext;

            let tenant = await this.tenantService.findById(payload.tenant.id);
            payload = await this.jwtService.verifyAsync(token, {publicKey: tenant.publicKey});
            console.log("token verified with public Key");
            if (payload.grant_type === GRANT_TYPES.CLIENT_CREDENTIAL) {
                if (payload.sub !== "oauth") {
                    throw new UnauthorizedException();
                }
            } else {
                let user = await this.usersService.findByEmail(payload.email);
            }
            return payload;
        } catch (e) {
            throw new UnauthorizedException(e);
        }
    }

    async validateClientCredentials(clientId: string, clientSecret: string): Promise<Tenant> {
        const tenant: Tenant = await this.tenantService.findByClientId(clientId);
        let valid: boolean = CryptUtil.verifyClientId(tenant.clientSecret, clientId, tenant.secretSalt);
        if (!valid) {
            throw new InvalidCredentialsException();
        }
        valid = CryptUtil.verifyClientSecret(tenant.clientSecret, clientSecret);
        if (!valid) {
            throw new InvalidCredentialsException();
        }
        return tenant;
    }

    async createTechnicalAccessToken(tenant: Tenant, roles: string[]): Promise<string> {
        roles = roles instanceof Array ? roles : [];
        const payload: SecurityContext = {
            sub: "oauth",
            email: "oauth@" + tenant.domain,
            name: "oauth",
            tenant: {
                id: tenant.id,
                name: tenant.name,
                domain: tenant.domain,
            },
            scopes: [RoleEnum.TENANT_VIEWER, ...roles],
            grant_type: GRANT_TYPES.CLIENT_CREDENTIAL
        };
        return this.jwtService.sign(payload, {privateKey: tenant.privateKey,});
    }

    /**
     * Create an access token for the user.
     */
    async createUserAccessToken(user: User, tenant: Tenant):
        Promise<{ accessToken: string, refreshToken: string }> {
        if (!user.verified) {
            throw new EmailNotVerifiedException();
        }

        let roles = await this.tenantService.getMemberRoles(tenant.id, user);

        const accessTokenPayload: SecurityContext = {
            sub: user.email,
            email: user.email,
            name: user.name,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                domain: tenant.domain,
            },
            scopes: roles.map(role => role.name),
            grant_type: GRANT_TYPES.PASSWORD
        };

        const refreshTokenPayload = {
            email: user.email,
            domain: tenant.domain
        }

        const accessToken = await this.jwtService
            .signAsync(accessTokenPayload, {
                privateKey: tenant.privateKey,
                issuer: this.configService.get("SUPER_TENANT_DOMAIN")
            });

        const refreshToken = await this.jwtService
            .signAsync(refreshTokenPayload, {
                privateKey: tenant.privateKey,
                expiresIn: this.configService.get("REFRESH_TOKEN_EXPIRATION_TIME"),
                issuer: this.configService.get("SUPER_TENANT_DOMAIN")
            });

        return {accessToken, refreshToken};
    }

    /**
     * Create a verification token for the user.
     */
    async createVerificationToken(user: User): Promise<string> {
        const payload: object = {
            sub: user.email
        };
        let globalTenant = await this.tenantService.findGlobalTenant();
        return this.jwtService.sign(payload, {
            privateKey: globalTenant.privateKey,
            expiresIn: this.configService.get('TOKEN_VERIFICATION_EXPIRATION_TIME')
        });
    }

    /**
     * Verify the user's email.
     */
    async verifyEmail(token: string): Promise<boolean> {
        let payload: any;
        try {
            let globalTenant = await this.tenantService.findGlobalTenant();
            payload = this.jwtService.verify(token, {
                publicKey: globalTenant.publicKey
            });
        } catch (exception: any) {
            throw new InvalidTokenException();
        }

        const user: User = await this.usersService.findByEmail(payload.sub);
        if (user.verified) {
            return false;
        }

        await this.usersService.updateVerified(user.id, true);

        return true;
    }

    /**
     * Create a reset password token for the user.
     */
    async createResetPasswordToken(user: User): Promise<string> {
        const payload: object =
            {
                sub: user.email
            };

        // Use the user's current password's hash for signing the token.
        // All tokens generated before a successful password change would get invalidated.
        return this.jwtService.sign(payload,
            {
                secret: user.password,
                expiresIn: this.configService.get('TOKEN_RESET_PASSWORD_EXPIRATION_TIME')
            });
    }

    /**
     * Reset the user's password.
     */
    async resetPassword(token: string, password: string): Promise<boolean> {
        // Get the user.
        let payload: any = this.jwtService.decode(token);
        const user: User = await this.usersService.findByEmail(payload.sub);
        if (!user) {
            throw new UserNotFoundException();
        }

        // The token is signed with the user's current password's hash.
        // A successful password change will invalidate the token.
        payload = null;
        try {
            payload = this.jwtService.verify(token, {secret: user.password});
        } catch (exception: any) {
            throw new InvalidTokenException();
        }

        if (!user.verified) {
            throw new EmailNotVerifiedException();
        }

        await this.usersService.updatePassword(user.id, password);

        return true;
    }

    /**
     * Create a change email token for the user.
     */
    async createChangeEmailToken(user: User, email: string): Promise<string> {
        const payload: object =
            {
                sub: user.email,
                email: email
            };

        // Use the user's current email for signing the token.
        // All tokens generated before a successful email change would get invalidated.
        return this.jwtService.sign(payload,
            {
                secret: user.email,
                expiresIn: this.configService.get('TOKEN_CHANGE_EMAIL_EXPIRATION_TIME')
            });
    }

    /**
     * Confirm the user's email change.
     */
    async confirmEmailChange(token: string): Promise<boolean> {
        // Get the user.
        let payload: any = this.jwtService.decode(token);
        const user: User = await this.usersService.findByEmail(payload.sub);
        if (!user) {
            throw new UserNotFoundException();
        }

        // The token is signed with the user's current email.
        // A successful email change will invalidate the token.
        payload = null;
        try {
            payload = this.jwtService.verify(token, {secret: user.email});
        } catch (exception: any) {
            throw new InvalidTokenException();
        }

        await this.usersService.updateEmail(user.id, payload.email);

        return true;
    }


}
