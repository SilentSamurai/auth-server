import {SMTPServer, SMTPServerDataStream, SMTPServerOptions, SMTPServerSession} from 'smtp-server';
import {AddressObject, EmailAddress, ParsedMail, simpleParser} from 'mailparser';

/**
 * Interface for environment configuration
 */
interface ServerConfig {
    port?: number;
    host?: string;
    logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

export interface EmailSearchCriteria {
    to?: string | RegExp;                // Recipient email address or pattern
    from?: string | RegExp;              // Sender email address or pattern
    subject?: string | RegExp;           // Subject line text or pattern
    body?: string | RegExp;              // Text in email body (text or HTML)
    hasAttachments?: boolean;            // Whether email has attachments
    after?: Date;                        // Emails received after this date
    before?: Date;                       // Emails received before this date
    containsLink?: boolean | RegExp;     // Whether email contains links (or matching specific pattern)
    limit?: number;                      // Maximum number of results to return
    sort?: 'newest' | 'oldest';          // Sort order
}

export class FakeSmtpServer {
    private server: SMTPServer;
    private config: Required<ServerConfig>;
    private logger: Console;

    public emails: ParsedMail[] = [];

    constructor(config: ServerConfig = {}) {
        this.config = this.getFullConfig(config);
        this.logger = console;

        // Create server with options
        const serverOptions = this.buildServerOptions();
        this.server = new SMTPServer(serverOptions);

        // Setup graceful shutdown
        this.setupShutdownHandlers();
    }

    public listen(): FakeSmtpServer {
        this.server.listen(this.config.port, this.config.host, () => {
            this.log('info', `SMTP Server listening on ${this.config.host}:${this.config.port}`);
        });
        return this;
    }

    public close(callback?: () => void): void {
        this.log('info', 'Closing SMTP server...');
        this.server.close(callback || (() => {
            this.log('info', 'SMTP Server closed');
        }));
    }

    /**
     * Set custom email handler
     * @param handler Function to handle parsed emails
     */
    public setEmailHandler(handler: (email: ParsedMail) => void): void {
        this.server.onData = (stream: SMTPServerDataStream, session: SMTPServerSession, callback: () => void): void => {
            simpleParser(stream)
                .then((parsedEmail: ParsedMail) => {
                    handler(parsedEmail);
                })
                .catch((err: Error) => {
                    this.log('error', 'Error parsing email:', err);
                })
                .finally(() => {
                    callback();
                });
        };
    }

    /**
     * Merge provided config with defaults and environment variables
     */
    private getFullConfig(config: ServerConfig): Required<ServerConfig> {
        return {
            port: config.port || parseInt(process.env.SMTP_PORT || '587', 10),
            host: config.host || process.env.SMTP_HOST || 'localhost',
            logLevel: config.logLevel || (process.env.SMTP_LOG_LEVEL as any) || 'info'
        };
    }

    /**
     * Build SMTP server options
     */
    private buildServerOptions(): SMTPServerOptions {
        return {
            onData: this.handleEmailData.bind(this),
            disabledCommands: ['AUTH', 'STARTTLS'],
            secure: false,
            secured: false,
            allowInsecureAuth: true,
            authOptional: true,
            disableReverseLookup: true,
        };
    }

    private handleEmailData(stream: SMTPServerDataStream, session: SMTPServerSession, callback: () => void): void {
        simpleParser(stream)
            .then(parsedEmail => {
                this.emails.push(parsedEmail);
                this.logEmailDetails(parsedEmail);
            })
            .catch(err => this.log('error', 'Error parsing email:', err))
            .finally(callback);
    }

    private logEmailDetails(parsedEmail: ParsedMail): void {
        this.log('info', 'Email received:', parsedEmail.subject);
        this.log('info', 'From:', parsedEmail.from?.text);
        this.log('info', 'To:', this.getRecipientText(parsedEmail));
        if (parsedEmail.attachments?.length) {
            this.log('info', `Attachments: ${parsedEmail.attachments.length}`);
        }
    }

    private setupShutdownHandlers(): void {
        // Handle termination signals
        process.on('SIGTERM', () => {
            this.log('info', 'SMTP Server shutting down (SIGTERM)...');
            this.close(() => {
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            this.log('info', 'SMTP Server shutting down (SIGINT)...');
            this.close(() => {
                process.exit(0);
            });
        });
    }

    private log(level: 'none' | 'error' | 'warn' | 'info' | 'debug', ...args: any[]): void {
        const levels = {none: 0, error: 1, warn: 2, info: 3, debug: 4};
        if (levels[level] <= levels[this.config.logLevel]) {
            console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'info' ? 'info' : 'log'](...args);
        }
    }

    private getRecipientText(email: ParsedMail): string {
        if (!email.to) return '';
        return Array.isArray(email.to)
            ? email.to.map(this.formatAddressObject).join(', ')
            : this.formatAddressObject(email.to);
    }

    private formatAddressObject(address: EmailAddress | AddressObject | any): string {
        if (typeof address === 'string') return address;
        if (typeof address === 'object') {
            if (address.group) return `${address.name || 'Group'}: ${address.group.map(this.formatAddressObject).join(', ')};`;
            return address.address || address.email || address.text || '';
        }
        return String(address);
    }

    public searchEmails(criteria: EmailSearchCriteria): ParsedMail[] {
        return this.emails
            .filter(email => this.matchEmail(email, criteria))
            .sort((a, b) => (criteria.sort === 'newest' ? b.date?.getTime() - a.date?.getTime() : a.date?.getTime() - b.date?.getTime()))
            .slice(0, criteria.limit);
    }

    private matchEmail(email: ParsedMail, criteria: EmailSearchCriteria): boolean {
        const match = (field: string | undefined, value: string | RegExp) =>
            field && (typeof value === 'string' ? field.includes(value) : value.test(field));

        if (criteria.to && !match(this.getRecipientText(email), criteria.to)) return false;
        if (criteria.from && !match(email.from?.text, criteria.from)) return false;
        if (criteria.subject && !match(email.subject, criteria.subject)) return false;
        if (criteria.body) {
            const fullContent = `${email.text || ''} ${email.html || ''}`;
            if (!match(fullContent, criteria.body)) return false;
        }
        if (criteria.hasAttachments !== undefined && (email.attachments?.length > 0) !== criteria.hasAttachments) return false;
        if (criteria.after && email.date && email.date < criteria.after) return false;
        if (criteria.before && email.date && email.date > criteria.before) return false;
        return true;
    }

    public waitForEmail(criteria: EmailSearchCriteria, timeoutMs = 5000, pollInterval = 500): Promise<ParsedMail> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkEmails = () => {
                const matchingEmail = this.searchEmails(criteria);
                if (matchingEmail.length > 0) {
                    return resolve(matchingEmail[0]);
                }

                if (Date.now() - startTime >= timeoutMs) {
                    return reject(new Error(`Timeout waiting for email matching: ${JSON.stringify(criteria)}`));
                }
                setTimeout(checkEmails, pollInterval);
            };
            checkEmails();
        });
    }

    public extractPaths(email: ParsedMail): string[] {
        const body = `${email.text || ""} ${email.html || ""}`;
        const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;

        return Array.from(new Set((body.match(urlRegex) || []).map(url => {
            try {
                return new URL(url).pathname;
            } catch (error) {
                return ""; // Ignore invalid URLs
            }
        }))).filter(path => path); // Remove empty values
    }

    public extractLinks(email: ParsedMail): string[] {
        const body = `${email.text || ""} ${email.html || ""}`;
        const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
        return Array.from(new Set(body.match(urlRegex) || [])); // Remove duplicates
    }

}


export const createFakeSmtpServer = (config: ServerConfig = {}): FakeSmtpServer => {
    return new FakeSmtpServer(config);
};

// Auto-start server if this file is executed directly
if (require.main === module) {
    const server = createFakeSmtpServer({});
    server.listen();
}