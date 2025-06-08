import {IMailProvider} from './IMailProvider';
import * as nodemailer from 'nodemailer';
import {Logger} from '@nestjs/common';

export class SmtpMailProvider implements IMailProvider {
    private transporter: any;
    private logger = new Logger('SMTP_MAIL');

    constructor(config: any) {
        this.transporter = nodemailer.createTransport({
            host: config.MAIL_HOST,
            port: config.MAIL_PORT,
            secure: config.MAIL_SECURE,
            auth: {
                user: config.MAIL_USER,
                pass: config.MAIL_PASSWORD,
            },
        });
    }

    async sendMail(options: any): Promise<boolean> {
        return new Promise((resolve) => {
            this.transporter.sendMail(options, (error, info) => {
                if (error) {
                    this.logger.error(
                        `Mail from ${options.from} to ${options.to} NOT sent: ${error.message}`,
                    );
                    resolve(false);
                } else {
                    this.logger.log(
                        `Mail from ${options.from} to ${options.to} sent successfully (SMTP)`
                    );
                    resolve(true);
                }
            });
        });
    }
} 