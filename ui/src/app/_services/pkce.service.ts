import { Injectable } from '@angular/core';

/**
 * Service for handling PKCE (Proof Key for Code Exchange) functionality.
 * This service manages code verifiers and challenges for OAuth 2.0 authorization code flow.
 */
@Injectable({
    providedIn: 'root'
})
export class PKCEService {
    private readonly CODE_VERIFIER_KEY = 'code-verifier';

    /**
     * Generate a random code verifier.
     * This method creates a cryptographically secure random string to be used as a code verifier.
     * @returns A randomly generated code verifier string
     */
    public generateCodeVerifier(): string {
        const array = new Uint32Array(56 / 2);
        const verifier = window.crypto.getRandomValues(array);
        const codeVerifier = Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join("");
        return codeVerifier;
    }

    public getCodeVerifier(): string {
        if (window.sessionStorage.getItem(this.CODE_VERIFIER_KEY) === null) {
            const verifier = this.generateCodeVerifier();
            window.sessionStorage.setItem(this.CODE_VERIFIER_KEY, verifier);
        }
        return window.sessionStorage.getItem(this.CODE_VERIFIER_KEY)!;
    }

    public async getCodeChallenge(method: string): Promise<string> {
        const codeVerifier = this.getCodeVerifier();
        return this.generateCodeChallenge(codeVerifier, method);
    }

    private generateCodeChallenge(verifier: string, method: string): string {
        if (method === 'S256') {
            // S256 method is commented out as it requires HTTPS
            // const hash = createHash('sha256').update(verifier).digest();
            // return base64urlencode(hash).replace(/=+$/, '');
            return verifier;
        }
        if (method === 'OWH32') {
            return this.oneWayHash(verifier);
        }
        return verifier;
    }

    public clearCodeVerifier(): void {
        window.sessionStorage.removeItem(this.CODE_VERIFIER_KEY);
    }

    private oneWayHash(plain: string): string {
        // Using FNV-1a hash algorithm as a fallback
        // In production, consider using a more secure method like SHA-256
        const FNV_PRIME = 16777619;
        const OFFSET_BASIS = 2166136261;
        let hash = OFFSET_BASIS;

        for (let i = 0; i < plain.length; i++) {
            hash ^= plain.charCodeAt(i);
            hash = (hash * FNV_PRIME) >>> 0; // Force to 32-bit integer
        }
        const finalHash = hash >>> 0;
        return `${finalHash}`; // Convert to unsigned 32-bit integer
    }

    public base64urlencode(a: ArrayBuffer): string {
        let str = "";
        const bytes = new Uint8Array(a);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return btoa(str)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "").toString();
    }
}




