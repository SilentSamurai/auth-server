import {IMailProvider} from './IMailProvider';
import {Resend} from 'resend';
import {Logger} from '@nestjs/common';

export class ResendMailProvider implements IMailProvider {
    private resend: Resend;
    private logger = new Logger('RESEND_MAIL');

    constructor(apiKey: string) {
        this.resend = new Resend(apiKey);
    }

    async sendMail(options: any): Promise<boolean> {
        try {
            const {data, error} = await this.resend.emails.send({
                from: options.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            if (error) {
                this.logger.error(
                    `Mail from ${options.from} to ${options.to} NOT sent: ${error.message}`,
                );
                return false;
            }
            this.logger.log(
                `Mail from ${options.from} to ${options.to} sent successfully (Resend)`
            );
            return true;
        } catch (error) {
            this.logger.error(
                `Mail from ${options.from} to ${options.to} NOT sent: ${error.message}`,
            );
            return false;
        }
    }
} 