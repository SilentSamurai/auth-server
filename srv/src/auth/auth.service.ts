import {Injectable, Logger, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {Environment} from "../config/environment.service";
import {UsersService} from "../services/users.service";
import {JwtService} from "@nestjs/jwt";
import {User} from "../entity/user.entity";
import * as argon2 from "argon2";
import {Tenant} from "../entity/tenant.entity";
import {TenantService} from "../services/tenant.service";
import {CryptUtil} from "../util/crypt.util";
import {RoleEnum} from "../entity/roleEnum";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {SecurityService} from "../casl/security.service";
import {
    ChangeEmailToken,
    EmailVerificationToken,
    GRANT_TYPES,
    RefreshToken,
    ResetPasswordToken,
    TechnicalToken,
    TenantToken,
    Token,
} from "../casl/contexts";
import {AuthUserService} from "../casl/authUser.service";
import * as yup from "yup";

const SecurityContextSchema = yup.object().shape({
    sub: yup.string().required("token is invalid"),
    tenant: yup.object().shape({
        id: yup.string().required("token is invalid").uuid("tenant id must be a valid UUID"),
        name: yup.string().required("token is invalid"),
        domain: yup.string().required("token is invalid"),
    }),
    scopes: yup.array().of(yup.string().max(128)),
    grant_type: yup.string().required("token is invalid"),
});

@Injectable()
export class AuthService {
    private readonly LOGGER = new Logger("AuthService");

    constructor(
        private readonly configService: Environment,
        private readonly securityService: SecurityService,
        private readonly authUserService: AuthUserService,
        private readonly userService: UsersService,
        private readonly tenantService: TenantService,
        private readonly jwtService: JwtService,
    ) {
    }

    /**
     * Validate the email and password.
     */
    async validate(email: string, password: string): Promise<User> {
        const user: User = await this.authUserService.findUserByEmail(email);
        const valid: boolean = await argon2.verify(user.password, password);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return user;
    }

    async validateRefreshToken(
        refreshToken: string,
    ): Promise<{ tenant: Tenant; user: User }> {
        let validationPipe = new ValidationPipe(
            ValidationSchema.RefreshTokenSchema,
        );
        let payload: RefreshToken = (await validationPipe.transform(
            this.jwtService.decode(refreshToken, {json: true}),
            null,
        )) as RefreshToken;

        let tenant = await this.authUserService.findTenantByDomain(
            payload.domain,
        );
        let user = await this.authUserService.findUserByEmail(payload.email);
        await this.jwtService.verifyAsync(refreshToken, {
            publicKey: tenant.publicKey,
        });
        return {tenant, user};
    }

    async validateAccessToken(token: string): Promise<Token> {
        try {
            let decoded = await new ValidationPipe(SecurityContextSchema).transform(
                this.jwtService.decode(token, {json: true}),
                null,
            );
            let tenant = await this.authUserService.findTenantByDomain(
                decoded.tenant.domain,
            );
            const verifiedToken = await this.jwtService.verifyAsync(token, {
                publicKey: tenant.publicKey,
            })
            const payload: Token = verifiedToken.isTechnical ? TechnicalToken.create(verifiedToken) : TenantToken.create(verifiedToken)

            this.LOGGER.log("token verified with public Key");
            if (payload.isTechnicalToken()) {
                if (payload.sub !== "oauth") {
                    throw "Invalid Token";
                }
            } else {
                let user = await this.authUserService.findUserByEmail(
                    (payload as TenantToken).email,
                );
            }
            return payload;
        } catch (e) {
            this.LOGGER.error("Token Validation Failed: ", e.stack);
            throw new UnauthorizedException(e);
        }
    }

    async validateClientCredentials(
        clientId: string,
        clientSecret: string,
    ): Promise<Tenant> {
        const tenant: Tenant =
            await this.authUserService.findTenantByClientId(clientId);
        let valid: boolean = CryptUtil.verifyClientId(
            tenant.clientSecret,
            clientId,
            tenant.secretSalt,
        );
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        valid = CryptUtil.verifyClientSecret(tenant.clientSecret, clientSecret);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return tenant;
    }

    createTechnicalToken(tenant: Tenant, roles: string[]): TechnicalToken {
        roles = roles instanceof Array ? roles : [];
        return TechnicalToken.create({
            sub: "oauth",
            tenant: {
                id: tenant.id,
                name: tenant.name,
                domain: tenant.domain,
            },
            scopes: [RoleEnum.TENANT_VIEWER, ...roles]
        });
    }

    async createTechnicalAccessToken(
        tenant: Tenant,
        roles: string[],
    ): Promise<string> {
        roles = roles instanceof Array ? roles : [];
        const payload = this.createTechnicalToken(
            tenant,
            roles,
        );
        return this.jwtService.sign(payload.asPlainObject(), {privateKey: tenant.privateKey});
    }

    /**
     * Create an access token for the user.
     */
    async createUserAccessToken(
        user: User,
        tenant: Tenant,
        scopes: string[] = [],
    ): Promise<{ accessToken: string; refreshToken: string; scopes: string[] }> {
        if (!user.verified) {
            throw new UnauthorizedException('Email not verified');
        }

        let roles = await this.authUserService.getMemberRoles(tenant, user);
        let scopesFromRoles = roles.map((role) => role.name);
        scopesFromRoles.push(...scopes);

        const accessTokenPayload = TenantToken.create({
            sub: user.email,
            email: user.email,
            name: user.name,
            userId: user.id,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                domain: tenant.domain,
            },
            userTenant: {
                id: tenant.id,
                name: tenant.name,
                domain: tenant.domain,
            },
            scopes: scopesFromRoles,
            grant_type: GRANT_TYPES.PASSWORD,
        });

        const refreshTokenPayload: RefreshToken = {
            email: user.email,
            domain: tenant.domain,
        };

        const accessToken = await this.jwtService.signAsync(
            accessTokenPayload.asPlainObject(),
            {
                privateKey: tenant.privateKey,
                issuer: this.configService.get("SUPER_TENANT_DOMAIN"),
            },
        );

        const refreshToken = await this.jwtService.signAsync(
            refreshTokenPayload,
            {
                privateKey: tenant.privateKey,
                expiresIn: this.configService.get(
                    "REFRESH_TOKEN_EXPIRATION_TIME",
                ),
                issuer: this.configService.get("SUPER_TENANT_DOMAIN"),
            },
        );

        return {accessToken, refreshToken, scopes: accessTokenPayload.scopes};
    }

    /**
     * Create an access token for a subscribed user.
     * This method is specifically for users who are accessing a different tenant than their own.
     */
    async createSubscribedUserAccessToken(
        user: User,
        issuingTenant: Tenant,
        userTenant: Tenant,
        scopes: string[] = [],
    ): Promise<{ accessToken: string; refreshToken: string; scopes: string[] }> {
        if (!user.verified) {
            throw new UnauthorizedException('Email not verified');
        }

        let roles = await this.authUserService.getMemberRoles(issuingTenant, user);
        let scopesFromRoles = roles.map((role) => role.name);
        scopesFromRoles.push(...scopes);

        const accessTokenPayload = TenantToken.create({
            sub: user.email,
            email: user.email,
            name: user.name,
            userId: user.id,
            tenant: {
                id: issuingTenant.id,
                name: issuingTenant.name,
                domain: issuingTenant.domain,
            },
            userTenant: {
                id: userTenant.id,
                name: userTenant.name,
                domain: userTenant.domain,
            },
            scopes: scopesFromRoles,
            grant_type: GRANT_TYPES.PASSWORD,
        });

        const refreshTokenPayload: RefreshToken = {
            email: user.email,
            domain: issuingTenant.domain,
        };

        const accessToken = await this.jwtService.signAsync(
            accessTokenPayload.asPlainObject(),
            {
                privateKey: issuingTenant.privateKey,
                issuer: this.configService.get("SUPER_TENANT_DOMAIN"),
            },
        );

        const refreshToken = await this.jwtService.signAsync(
            refreshTokenPayload,
            {
                privateKey: issuingTenant.privateKey,
                expiresIn: this.configService.get(
                    "REFRESH_TOKEN_EXPIRATION_TIME",
                ),
                issuer: this.configService.get("SUPER_TENANT_DOMAIN"),
            },
        );

        return {accessToken, refreshToken, scopes: accessTokenPayload.scopes};
    }

    /**
     * Create a verification token for the user.
     */
    async createVerificationToken(user: User): Promise<string> {
        const payload: EmailVerificationToken = {
            sub: user.email,
        };
        let globalTenant = await this.authUserService.findGlobalTenant();
        return this.jwtService.sign(payload, {
            privateKey: globalTenant.privateKey,
            expiresIn: this.configService.get(
                "TOKEN_VERIFICATION_EXPIRATION_TIME",
            ),
        });
    }

    /**
     * Verify the user's email.
     */
    async verifyEmail(token: string): Promise<boolean> {
        let payload: EmailVerificationToken;
        try {
            let globalTenant = await this.authUserService.findGlobalTenant();
            payload = this.jwtService.verify(token, {
                publicKey: globalTenant.publicKey,
            }) as EmailVerificationToken;
        } catch (exception: any) {
            throw new UnauthorizedException('Invalid token');
        }

        const authContext = await this.securityService.getUserAuthContext(
            payload.sub,
        );

        const user: User = await this.userService.findByEmail(
            authContext,
            payload.sub,
        );
        if (user.verified) {
            return false;
        }

        await this.userService.updateVerified(authContext, user.id, true);

        return true;
    }

    /**
     * Create a reset password token for the user.
     */
    async createResetPasswordToken(user: User): Promise<string> {
        const payload: ResetPasswordToken = {
            sub: user.email,
        };

        // Use the user's current password's hash for signing the token.
        // All tokens generated before a successful password change would get invalidated.
        return this.jwtService.sign(payload, {
            secret: user.password,
            expiresIn: this.configService.get(
                "TOKEN_RESET_PASSWORD_EXPIRATION_TIME",
            ),
        });
    }

    /**
     * Reset the user's password.
     */
    async resetPassword(token: string, password: string): Promise<boolean> {
        // Get the user.
        let payload: ResetPasswordToken = this.jwtService.decode(
            token,
        ) as ResetPasswordToken;

        const user: User = await this.authUserService.findUserByEmail(
            payload.sub,
        );
        if (!user) {
            throw new NotFoundException("User not found");
        }

        // The token is signed with the user's current password's hash.
        // A successful password change will invalidate the token.
        payload = null;
        try {
            payload = this.jwtService.verify(token, {secret: user.password});
        } catch (exception: any) {
            throw new UnauthorizedException('Invalid token');
        }

        const authContext = await this.securityService.getUserAuthContext(
            payload.sub,
        );

        if (!user.verified) {
            throw new UnauthorizedException('Email not verified');
        }

        await this.userService.updatePassword(authContext, user.id, password);

        return true;
    }

    /**
     * Create a change email token for the user.
     */
    async createChangeEmailToken(user: User, email: string): Promise<string> {
        const payload: ChangeEmailToken = {
            sub: user.email,
            updatedEmail: email,
        };

        let globalTenant = await this.authUserService.findGlobalTenant();
        // Use the user's current email for signing the token.
        // All tokens generated before a successful email change would get invalidated.
        return this.jwtService.sign(payload, {
            secret: globalTenant.privateKey,
            expiresIn: this.configService.get(
                "TOKEN_CHANGE_EMAIL_EXPIRATION_TIME",
            ),
        });
    }

    /**
     * Confirm the user's email change.
     */
    async confirmEmailChange(token: string): Promise<boolean> {
        // Get the user.
        let payload: ChangeEmailToken = this.jwtService.decode(
            token,
        ) as ChangeEmailToken;

        const user: User = await this.authUserService.findUserByEmail(
            payload.sub,
        );
        if (!user) {
            throw new NotFoundException("User not found");
        }

        // The token is signed with the user's current email.
        // A successful email change will invalidate the token.
        let globalTenant = await this.authUserService.findGlobalTenant();
        payload = null;
        try {
            payload = this.jwtService.verify(token, {
                secret: globalTenant.publicKey,
            }) as ChangeEmailToken;
        } catch (exception: any) {
            throw new UnauthorizedException('Invalid token');
        }

        const authContext = await this.securityService.getUserAuthContext(
            payload.sub,
        );

        await this.userService.updateEmail(
            authContext,
            user.id,
            payload.updatedEmail,
        );

        return true;
    }


    public decodeToken(token: string): any {
        return this.jwtService.decode(token, {json: true});
    }
}
