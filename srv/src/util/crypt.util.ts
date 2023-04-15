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
        const {clientSecret, salt} = this.generateClientSecret(clientId);
        return {clientId, clientSecret, salt};
    }

    public static verifyClientId(storedSecret, suppliedKey, salt) {
        const buffer = scryptSync(suppliedKey, salt, 64) as Buffer;
        return timingSafeEqual(Buffer.from(storedSecret, 'hex'), buffer);
    }

    public static verifyClientSecret(storedSecret, providedSecret) {
        return timingSafeEqual(Buffer.from(storedSecret, 'hex'), Buffer.from(providedSecret, 'hex'));
    }

    private static generateClientId() {
        const buffer = randomBytes(16);
        return buffer.toString("hex");
    }

    private static generateClientSecret(clientId: string) {
        const salt = randomBytes(8).toString('hex');
        const buffer = scryptSync(clientId, salt, 64) as Buffer;
        return {clientSecret: buffer.toString('hex'), salt};
    }
}
