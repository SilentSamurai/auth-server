import {createHash, generateKeyPairSync, randomBytes, scryptSync, timingSafeEqual} from "crypto";

function base64UrlEncode(input: Buffer | string): string {
    let encoded = Buffer.from(input).toString('base64');
    encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return encoded;
}

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

    public static verifyClientSecret(storedSecret: string, providedSecret: string) {
        if (storedSecret.length !== providedSecret.length) {
            return false;
        }
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

    public static generateCodeVerifier(length: number = 64): string {
        const verifier = randomBytes(length);
        return base64UrlEncode(verifier).substring(0, length);
    }

    public static generateCodeChallenge(verifier: string): string {
        const hash = createHash('sha256').update(verifier).digest();
        return base64UrlEncode(hash).replace(/=+$/, '');
    }

    public static generateRandomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            randomString += characters.charAt(randomIndex);
        }
        return randomString;
    }
}
