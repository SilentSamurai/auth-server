import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Headers,
    Param,
    Post,
    Request,
    Response,
    UseInterceptors,
} from "@nestjs/common";

import {User} from "../entity/user.entity";
import {Environment} from "../config/environment.service";
import {AuthService} from "../auth/auth.service";
import {UsersService} from "../services/users.service";
import {MailService} from "../mail/mail.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {MailServiceErrorException} from "../exceptions/mail-service-error.exception";
import {TenantService} from "../services/tenant.service";
import {Tenant} from "../entity/tenant.entity";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {InvalidTokenException} from "../exceptions/invalid-token.exception";
import {AuthCodeService} from "../auth/auth-code.service";
import {GRANT_TYPES, TenantToken} from "../casl/contexts";
import {AuthUserService} from "../casl/authUser.service";
import {request} from "express";
import {SecurityService} from "../casl/security.service";

@Controller("api/oauth")
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(
        private readonly configService: Environment,
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService,
        private readonly mailService: MailService,
        private readonly authCodeService: AuthCodeService,
        private readonly authUserService: AuthUserService,
        private readonly securityService: SecurityService,
    ) {
    }

    @Post("/login")
    async login(
        @Body(new ValidationPipe(ValidationSchema.LoginSchema))
            body: {
            client_id: string;
            password: string;
            email: string;
            code_challenge_method: string;
            code_challenge: string;
        },
    ) {
        const user: User = await this.authService.validate(
            body.email,
            body.password,
        );

        let tenant: Tenant;
        if (await this.authUserService.tenantExistsByDomain(body.client_id)) {
            tenant = await this.authUserService.findTenantByDomain(
                body.client_id,
            );
        } else if (
            await this.authUserService.tenantExistsByClientId(body.client_id)
        ) {
            tenant = await this.authUserService.findTenantByClientId(
                body.client_id,
            );
        } else {
            throw new BadRequestException("domain || client_id is required");
        }

        const auth_code = await this.authCodeService.createAuthToken(
            user,
            tenant,
            body.code_challenge,
            body.code_challenge_method,
        );
        return {
            authentication_code: auth_code,
        };
    }

    @Post("/token")
    async oauthToken(
        @Body()
            body: {
            client_id: string;
            client_secret: string;
            password: string;
            username: string;
            refresh_token: string;
            code: string;
            code_verifier: string;
            grant_type: GRANT_TYPES;
            scopes: string[];
        },
    ): Promise<any> {
        switch (body.grant_type) {
            case GRANT_TYPES.CODE: {
                let validationPipe = new ValidationPipe(
                    ValidationSchema.CodeGrantSchema,
                );
                await validationPipe.transform(body, null);
                const {user, tenant} =
                    await this.authCodeService.validateAuthCode(
                        body.code,
                        body.code_verifier,
                    );
                const {accessToken, refreshToken} =
                    await this.authService.createUserAccessToken(user, tenant);
                return {
                    access_token: accessToken,
                    expires_in: this.configService.get(
                        "TOKEN_EXPIRATION_TIME_IN_SECONDS",
                    ),
                    token_type: "Bearer",
                    refresh_token: refreshToken,
                };
            }
            case GRANT_TYPES.PASSWORD: {
                let validationPipe = new ValidationPipe(
                    ValidationSchema.PasswordGrantSchema,
                );
                await validationPipe.transform(body, null);
                const user: User = await this.authService.validate(
                    body.username,
                    body.password,
                );
                let tenant: Tenant;
                if (
                    await this.authUserService.tenantExistsByDomain(
                        body.client_id,
                    )
                ) {
                    tenant = await this.authUserService.findTenantByDomain(
                        body.client_id,
                    );
                } else if (
                    await this.authUserService.tenantExistsByClientId(
                        body.client_id,
                    )
                ) {
                    tenant = await this.authUserService.findTenantByClientId(
                        body.client_id,
                    );
                } else {
                    throw new BadRequestException("client_id is required");
                }
                let adminContext =
                    await this.securityService.getAdminContextForInternalUse();
                if (
                    !(await this.tenantService.isMember(
                        adminContext,
                        tenant.id,
                        user,
                    ))
                ) {
                    throw new BadRequestException("invalid request");
                }
                const {accessToken, refreshToken} =
                    await this.authService.createUserAccessToken(user, tenant);
                return {
                    access_token: accessToken,
                    expires_in: this.configService.get(
                        "TOKEN_EXPIRATION_TIME_IN_SECONDS",
                    ),
                    token_type: "Bearer",
                    refresh_token: refreshToken,
                };
            }
            case GRANT_TYPES.CLIENT_CREDENTIALS:
            case GRANT_TYPES.CLIENT_CREDENTIAL: {
                let validationPipe = new ValidationPipe(
                    ValidationSchema.ClientCredentialGrantSchema,
                );
                await validationPipe.transform(body, null);
                const tenant: Tenant =
                    await this.authService.validateClientCredentials(
                        body.client_id,
                        body.client_secret,
                    );
                const token: string =
                    await this.authService.createTechnicalAccessToken(
                        tenant,
                        body.scopes,
                    );
                return {
                    access_token: token,
                    expires_in: this.configService.get(
                        "TOKEN_EXPIRATION_TIME_IN_SECONDS",
                    ),
                    token_type: "Bearer",
                };
            }
            case GRANT_TYPES.REFRESH_TOKEN: {
                let validationPipe = new ValidationPipe(
                    ValidationSchema.RefreshTokenGrantSchema,
                );
                await validationPipe.transform(body, null);
                const {tenant, user} =
                    await this.authService.validateRefreshToken(
                        body.refresh_token,
                    );
                const {accessToken, refreshToken} =
                    await this.authService.createUserAccessToken(user, tenant);
                return {
                    access_token: accessToken,
                    expires_in: this.configService.get(
                        "TOKEN_EXPIRATION_TIME_IN_SECONDS",
                    ),
                    token_type: "Bearer",
                    refresh_token: refreshToken,
                };
            }
            default:
                throw new BadRequestException("grant type not recognised.");
        }
    }

    @Post("/verify-auth-code")
    async authCode(@Body() body: { auth_code: string }) {
        const authCodeObj = await this.authCodeService.findByCode(
            body.auth_code,
        );
        const user = await this.authUserService.findUserById(
            authCodeObj.userId,
        );
        return {
            authentication_code: body.auth_code,
            status: true,
            email: user.email,
        };
    }

    @Post("/verify")
    async verifyAccessToken(
        @Body(new ValidationPipe(ValidationSchema.VerifyTokenSchema))
            body: {
            access_token: string;
            client_id: string;
            client_secret: string;
        },
    ): Promise<object> {
        const tenant = await this.authService.validateClientCredentials(
            body.client_id,
            body.client_secret,
        );
        let securityContext: TenantToken =
            await this.authService.validateAccessToken(body.access_token);
        if (securityContext.tenant.id !== tenant.id) {
            throw new InvalidTokenException("not a valid token");
        }
        return securityContext;
    }

    @Post("/exchange")
    async exchangeAccessToken(
        @Body(new ValidationPipe(ValidationSchema.ExchangeTokenSchema))
            body: {
            access_token: string;
            client_id: string;
            client_secret: string;
        },
    ): Promise<object> {
        let tenantToken = await this.authService.validateAccessToken(
            body.access_token,
        );
        if (tenantToken.grant_type !== GRANT_TYPES.PASSWORD) {
            throw new ForbiddenException("grant_type not allowed");
        }
        await this.authService.validateClientCredentials(
            body.client_id,
            body.client_secret,
        );
        const user = await this.authUserService.findUserByEmail(
            tenantToken.email,
        );
        const tenant = await this.authUserService.findTenantByClientId(
            body.client_id,
        );
        const {accessToken, refreshToken} =
            await this.authService.createUserAccessToken(user, tenant);
        return {
            access_token: accessToken,
            expires_in: this.configService.get("TOKEN_EXPIRATION_TIME"),
            token_type: "Bearer",
            refresh_token: refreshToken,
        };
    }

    @Get("/verify-email/:token")
    async verifyEmail(
        @Request() request,
        @Param("token") token: string,
        @Response() response,
    ): Promise<any> {
        const verified: boolean = await this.authService.verifyEmail(token);

        let link: any = this.configService.get("VERIFY_EMAIL_LINK");
        if (!link || link === "") {
            response.send({status: verified});
        } else {
            link += (link.endsWith("/") ? "" : "/") + token;
            response.redirect(link);
        }
    }

    @Post("/forgot-password")
    async forgotPassword(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.ForgotPasswordSchema))
            body: any,
    ): Promise<object> {
        const user: User = await this.authUserService.findUserByEmail(
            body.email,
        );
        const token: string =
            await this.authService.createResetPasswordToken(user);

        let link: any = this.configService.get("RESET_PASSWORD_LINK");
        if (!link || link === "") {
            link += "https://" + headers.host + "/reset-password/" + token;
        } else {
            link += (link.endsWith("/") ? "" : "/") + token;
        }

        const sent: boolean = await this.mailService.sendResetPasswordMail(
            user,
            link,
        );
        if (!sent) {
            throw new MailServiceErrorException();
        }

        return {status: sent};
    }

    @Post("/reset-password/:token")
    async resetPassword(
        @Param("token") token: string,
        @Body(new ValidationPipe(ValidationSchema.ResetPasswordSchema))
            body: any,
    ): Promise<object> {
        const reset: boolean = await this.authService.resetPassword(
            token,
            body.password,
        );
        return {status: reset};
    }

    @Get("/change-email/:token")
    async changeEmail(
        @Param("token") token: string,
        @Response() response,
    ): Promise<any> {
        const confirmed: boolean =
            await this.authService.confirmEmailChange(token);

        let link: any = this.configService.get("CHANGE_EMAIL_LINK");
        if (!link || link === "") {
            response.send({status: confirmed});
        } else {
            response.redirect(link);
        }
    }
}
