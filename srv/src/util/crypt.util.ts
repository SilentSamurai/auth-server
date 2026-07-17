import {createHash, generateKeyPairSync, randomBytes, randomInt} from "crypto";
import {generate} from "otp-generator";

function base64UrlEncode(input: Buffer | string): string {
    let encoded = Buffer.from(input).toString("base64");
    encoded = encoded
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    return encoded;
}

export class CryptUtil {
    public static generateKeyPair() {
        return generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: "spki",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
            },
        });
    }

    public static generateECKeyPair() {
        return generateKeyPairSync("ec", {
            namedCurve: "P-256",
            publicKeyEncoding: {
                type: "spki",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
            },
        });
    }

    public static generateCodeVerifier(length: number = 64): string {
        const verifier = randomBytes(length);
        return base64UrlEncode(verifier).substring(0, length);
    }

    public static generateCodeChallenge(
        verifier: string,
        method: string,
    ): string {
        if (method === "S256") {
            // commenting as cannot use in http context only https allowed.
            const hash = createHash("sha256").update(verifier).digest();
            return base64UrlEncode(hash).replace(/=+$/, "");
        }
        return verifier;
    }

    /**
     * Generate an authorization code with 256 bits of entropy, per the
     * RFC 6749 §10.10 requirement that codes not be guessable.
     */
    public static generateAuthorizationCode(): string {
        return base64UrlEncode(randomBytes(32));
    }

    public static generateRandomString(length: number): string {
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let randomString = "";
        for (let i = 0; i < length; i++) {
            randomString += characters.charAt(randomInt(characters.length));
        }
        return randomString;
    }

    public static generateOTP(length: number): string {
        return generate(length, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });
    }


}
