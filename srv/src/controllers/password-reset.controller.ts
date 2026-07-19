import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Headers,
    Logger,
    Param,
    Post,
    UseInterceptors,
} from "@nestjs/common";

import {User} from "../entity/user.entity";
import {Environment} from "../config/environment.service";
import {AuthService} from "../auth/auth.service";
import {MailService} from "../mail/mail.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {AuthUserService} from "../casl/authUser.service";

@Controller("api/oauth")
@UseInterceptors(ClassSerializerInterceptor)
export class PasswordResetController {
    private readonly logger = new Logger(PasswordResetController.name);

    constructor(
        private readonly configService: Environment,
        private readonly authService: AuthService,
        private readonly mailService: MailService,
        private readonly authUserService: AuthUserService,
    ) {
    }

    @Post("/forgot-password")
    async forgotPassword(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.ForgotPasswordSchema))
        body: any,
    ): Promise<object> {
        // Always respond identically — same body and same status — whether or
        // not the address is registered, so this endpoint cannot enumerate
        // accounts. Every failure (unknown address, mail error, or the per-user
        // mail rate limit) is swallowed and logged rather than surfaced: a 503
        // here used to leak existence, since only a registered address can reach
        // the mail rate limit. Delivery is awaited (not fire-and-forget) so the
        // per-recipient rate-limit counter stays consistent under concurrency.
        let user: User | null;
        try {
            user = await this.authUserService.findUserByEmail(body.email);
        } catch {
            user = null;
        }

        if (user) {
            await this.sendResetPasswordMailSafely(user);
        }

        return {status: true};
    }

    /**
     * Build and send the reset-password mail. Never throws and never changes
     * the caller's response — a failed or rate-limited send must not reveal
     * whether the account exists (see {@link forgotPassword}).
     */
    private async sendResetPasswordMailSafely(user: User): Promise<void> {
        try {
            const token: string = await this.authService.createResetPasswordToken(user);
            const baseUrl = this.configService.get("BASE_URL");
            const link = `${baseUrl}/reset-password/${token}`;

            const sent: boolean = await this.mailService.sendResetPasswordMail(user, link);
            if (!sent) {
                this.logger.warn(
                    `Reset-password mail not sent for user ${user.id} (mail error or rate limit)`,
                );
            }
        } catch (error: any) {
            this.logger.error(
                `Error sending reset-password mail to user ${user.id}: ${error?.message ?? error}`,
            );
        }
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
}
