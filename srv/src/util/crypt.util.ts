import {generateKeyPairSync, randomBytes, scryptSync, timingSafeEqual} from "crypto";


export class CryptUtil {

    public static generateKeyPair() {
        return generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
    }

    public static generateClientIdAndSecret() {
        const clientId = this.generateClientId();
        const clientSecret = this.generateClientSecret(clientId);
        return {clientId, clientSecret};
    }

    public static verifyClientId(storedSecret, suppliedKey) {
        const [hashedPassword, salt] = storedSecret.split('.');

        const buffer = scryptSync(suppliedKey, salt, 64) as Buffer;
        return timingSafeEqual(Buffer.from(hashedPassword, 'hex'), buffer);
    }

    public static verifyClientSecret(storedSecret, providedSecret) {
        const [hashedPassword, salt] = storedSecret.split('.');
        return timingSafeEqual(Buffer.from(hashedPassword, 'hex'), providedSecret);
    }

    public static generateRefreshToken() {
        const buffer = randomBytes(32);
        return buffer.toString("base64") + "-r";
    }

    private static generateClientId() {
        const buffer = randomBytes(16);
        return buffer.toString("base64");
    }

    private static generateClientSecret(clientId: string) {
        const salt = randomBytes(8).toString('hex');
        const buffer = scryptSync(clientId, salt, 64) as Buffer;
        return `${buffer.toString('hex')}.${salt}`;
    }
}
