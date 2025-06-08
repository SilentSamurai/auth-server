import {Injectable, Logger} from "@nestjs/common";
import {Environment} from "../config/environment.service";
import {User} from "../entity/user.entity";
import {IMailProvider} from './IMailProvider';
import {SmtpMailProvider} from './SmtpMailProvider';
import {ResendMailProvider} from './ResendMailProvider';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

@Injectable()
export class MailService {
    private logger = new Logger("MailService");
    private mailProvider: IMailProvider;
    private readonly MAX_EMAILS_PER_DAY = 3;
    private readonly isRateLimitDisabled: boolean;

    // Common domain aliases mapping
    private readonly domainAliases: { [key: string]: string } = {
        'googlemail.com': 'gmail.com',
        'ymail.com': 'yahoo.com',
        'outlook.com': 'hotmail.com',
        'live.com': 'hotmail.com',
        'msn.com': 'hotmail.com'
    };

    constructor(
        private readonly configService: Environment,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {
        const provider = this.configService.get("MAIL_PROVIDER", "smtp");
        if (provider === 'resend') {
            this.mailProvider = new ResendMailProvider(this.configService.get("RESEND_API_KEY"));
        } else {
            this.mailProvider = new SmtpMailProvider({
                MAIL_HOST: this.configService.get("MAIL_HOST"),
                MAIL_PORT: this.configService.get("MAIL_PORT"),
                MAIL_SECURE: this.configService.get("MAIL_SECURE"),
                MAIL_USER: this.configService.get("MAIL_USER"),
                MAIL_PASSWORD: this.configService.get("MAIL_PASSWORD"),
            });
        }
        this.isRateLimitDisabled = this.configService.get("DISABLE_MAIL_RATE_LIMIT", "false");
    }

    /**
     * Send a mail.
     */
    async sendMail(options: any): Promise<boolean> {
        if (!options?.to) {
            this.logger.error('No recipient email provided');
            return false;
        }

        // Check rate limit for the recipient if not disabled
        if (!this.isRateLimitDisabled && await this.isRateLimitExceeded(options.to)) {
            this.logger.warn(`Daily rate limit exceeded for ${options.to}, email not sent`);
            return false;
        }

        return this.mailProvider.sendMail(options);
    }

    /**
     * Send a verification mail.
     */
    async sendVerificationMail(user: User, link: string): Promise<boolean> {
        const serviceName: string = await this.configService.getServiceName();
        const expirationTime: any = await this.configService.get(
            "TOKEN_VERIFICATION_EXPIRATION_TIME",
        );
        const from: any = await this.configService.get("MAIL_NOREPLY_FROM");

        let html: string = `
		<p style="font-size: 25px">
			Hi ${user.name},
		</p>
		<p style="font-size: 15px">
			Welcome! We are happy you signed up on ${serviceName}. Please verify your email address.
		</p>
		<p style="margin: 50px 0px 50px 10px">
			<a href="${link}" style="background-color: hsla(195, 100%, 36%, 1); border: none; border-radius: 25px; color: white; cursor: pointer; font-size: 16px; margin: 4px 2px; padding: 15px 32px; text-align: center; text-decoration: none;">
				Verify Email
			</a>
		</p>
		<p style="font-size: 20px">
			The ${serviceName} Team.
		</p>
		<p>
			Ignore this email if you didn't sign up. This verification link will expire in ${expirationTime}.
		</p>
		`;

        const options: object = {
            from: from,
            to: user.email,
            subject: `Thank you for signing up for ${serviceName}`,
            html: html,
        };

        return await this.sendMail(options);
    }

    /**
     * Send a reset password mail.
     */
    async sendResetPasswordMail(user: User, link: string): Promise<boolean> {
        const serviceName: string = await this.configService.getServiceName();
        const expirationTime: any = await this.configService.get(
            "TOKEN_RESET_PASSWORD_EXPIRATION_TIME",
        );
        const from: any = await this.configService.get("MAIL_NOREPLY_FROM");

        let html: string = `
		<p style="font-size: 25px">
			Hi ${user.name},
		</p>
		<p style="font-size: 15px">
			We got your request to change your password!
		</p>
		<p style="margin: 50px 0px 50px 10px">
			<a href="${link}" style="background-color: hsla(195, 100%, 36%, 1); border: none; border-radius: 25px; color: white; cursor: pointer; font-size: 16px; margin: 4px 2px; padding: 15px 32px; text-align: center; text-decoration: none;">
				Reset Password
			</a>
		</p>
		<p style="font-size: 15px">
			Just so you know: You have ${expirationTime} to pick your password. After that, you'll have to ask for a new one.
		</p>
		<p style="font-size: 20px">
			The ${serviceName} Team.
		</p>
		<p>
			Didn't ask for a new password? You can ignore this email.
		</p>
		`;

        const options: object = {
            from: from,
            to: user.email,
            subject: `Reset your password on ${serviceName}`,
            html: html,
        };

        return await this.sendMail(options);
    }

    async sendChangeEmailMail(email: string, link: string): Promise<boolean> {
        const serviceName: string = await this.configService.getServiceName();
        const expirationTime: any = await this.configService.get(
            "TOKEN_CHANGE_EMAIL_EXPIRATION_TIME",
        );
        const from: any = await this.configService.get("MAIL_NOREPLY_FROM");

        let html: string = `
		<p style="font-size: 25px">
			Hi,
		</p>
		<p style="font-size: 15px">
			You have requested an email change on ${serviceName}. Please confirm your email address change.
		</p>
		<p style="margin: 50px 0px 50px 10px">
			<a href="${link}" style="background-color: hsla(195, 100%, 36%, 1); border: none; border-radius: 25px; color: white; cursor: pointer; font-size: 16px; margin: 4px 2px; padding: 15px 32px; text-align: center; text-decoration: none;">
				Confirm
			</a>
		</p>
		<p style="font-size: 20px">
			The ${serviceName} Team.
		</p>
		<p>
			Ignore this email if you haven't requested an email change on ${serviceName}. This verification link will expire in ${expirationTime}.
		</p>
		`;

        const options: object = {
            from: from,
            to: email,
            subject: `Change your email on ${serviceName}`,
            html: html,
        };

        return await this.sendMail(options);
    }

    /**
     * Validate email format
     * @param email Email address to validate
     * @returns true if email is valid
     */
    private isValidEmail(email: string): boolean {
        if (!email || typeof email !== 'string') {
            return false;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    /**
     * Normalize email address to prevent rate limit bypassing with aliases
     * @param email Email address to normalize
     * @returns Normalized email address or null if invalid
     */
    private normalizeEmail(email: string): string | null {
        if (!this.isValidEmail(email)) {
            return null;
        }

        // Convert to lowercase
        email = email.toLowerCase();

        // Split into local part and domain
        const [localPart, domain] = email.split('@');
        if (!domain) {
            return null;
        }

        // Remove everything after + in the local part
        const normalizedLocalPart = localPart.split('+')[0];

        // Normalize domain (handle common aliases)
        const normalizedDomain = this.domainAliases[domain] || domain;

        return `${normalizedLocalPart}@${normalizedDomain}`;
    }

    /**
     * Check if user has exceeded email rate limit
     * @param email User's email address
     * @returns true if rate limit exceeded or email is invalid, false otherwise
     */
    private async isRateLimitExceeded(email: string): Promise<boolean> {
        const normalizedEmail = this.normalizeEmail(email);
        if (!normalizedEmail) {
            this.logger.warn(`Invalid email format: ${email}`);
            return true; // Prevent sending to invalid emails
        }

        // Find user by email
        const user = await this.userRepository.findOne({
            where: {email: normalizedEmail}
        });

        if (!user) {
            this.logger.warn(`User not found for email: ${normalizedEmail}`);
            return true; // Prevent sending to non-existent users
        }

        const now = new Date();

        // Reset count if it's been more than 24 hours since last reset
        if (user.emailCountResetAt && (now.getTime() - user.emailCountResetAt.getTime() > 24 * 60 * 60 * 1000)) {
            user.emailCount = 0;
            user.emailCountResetAt = now;
        } else if (!user.emailCountResetAt) {
            // First time sending email
            user.emailCountResetAt = now;
        }

        if (user.emailCount >= this.MAX_EMAILS_PER_DAY) {
            this.logger.warn(
                `Daily rate limit exceeded for user ${normalizedEmail}. ` +
                `Sent ${user.emailCount}/${this.MAX_EMAILS_PER_DAY} emails today.`
            );
            return true;
        }

        // Increment count and save
        user.emailCount += 1;
        await this.userRepository.save(user);

        this.logger.log(
            `Email count for ${normalizedEmail}: ${user.emailCount}/${this.MAX_EMAILS_PER_DAY}`
        );
        return false;
    }
}
