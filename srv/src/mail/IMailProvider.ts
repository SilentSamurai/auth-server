export interface IMailProvider {
    sendMail(options: any): Promise<boolean>;
} 