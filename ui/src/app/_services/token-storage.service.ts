import {Injectable} from '@angular/core';
import jwt_decode from "jwt-decode";
import {Router} from "@angular/router";

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const CODE_KEY = 'auth-code';
const CODE_VERIFIER = 'code-verifier';

@Injectable({
    providedIn: 'root'
})
export class TokenStorageService {
    constructor(private router: Router,) {
    }

    public clearSession(): void {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        window.sessionStorage.removeItem(CODE_KEY);
    }

    async signOut(): Promise<void> {
        this.clearSession();
        await this.router.navigateByUrl(`/login`);
    }

    public getAuthCode(): string | null {
        return window.sessionStorage.getItem(CODE_KEY);
    }

    public saveAuthCode(code: string): void {
        window.sessionStorage.removeItem(CODE_KEY);
        window.sessionStorage.setItem(CODE_KEY, code);
    }

    public saveToken(token: string): void {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.setItem(TOKEN_KEY, token);
        const userInfo = this.getDecodedAccessToken(token); // decode token
        this.saveUser(userInfo);
    }

    public getToken(): string | null {
        const token = window.localStorage.getItem(TOKEN_KEY);
        if (token == null || tokenExpired(token)) {
            return null;
        }
        return token;
    }

    public isTokenExpired(): boolean {
        const token = window.localStorage.getItem(TOKEN_KEY);
        return token != null && tokenExpired(token);

    }

    // public async getToken(): Promise<string | null> {
    //     const token = window.localStorage.getItem(TOKEN_KEY);
    //     if (token == null || tokenExpired(token)) {
    //         await this.router.navigateByUrl("/login");
    //         return null;
    //     }
    //     return token;
    // }

    public getUser(): any {
        const user = window.localStorage.getItem(USER_KEY);
        if (user) {
            return JSON.parse(user);
        }
        return null;
    }

    private getDecodedAccessToken(token: string): any {
        try {
            return jwt_decode(token);
        } catch (Error) {
            return null;
        }
    }

    public getCodeVerifier(): string {
        if (window.localStorage.getItem(CODE_VERIFIER) === null) {
            const verifier = generateCodeVerifier();
            window.localStorage.setItem(CODE_VERIFIER, verifier);
        }
        return window.localStorage.getItem(CODE_VERIFIER)!;
    }

    public isLoggedIn(): boolean {
        return !!this.getToken();
    }

    public isSuperAdmin(): boolean {
        return this.isLoggedIn() && this.getUser().scopes.find((scope: string) => scope === "SUPER_ADMIN") !== undefined;
    }

    public isTenantAdmin(): boolean {
        return this.isSuperAdmin() || this.isLoggedIn() && this.getUser().scopes.find((scope: string) => scope === "TENANT_ADMIN") !== undefined;
    }

    public async getCodeChallenge(): Promise<string> {
        let codeVerifier = this.getCodeVerifier();
        return await generateCodeChallengeFromVerifier(codeVerifier);
    }

    private saveUser(user: any): void {
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}


function generateCodeVerifier(): string {
    var array = new Uint32Array(56 / 2);
    const verifier = window.crypto.getRandomValues(array);
    return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join("");
}

function sha256(plain: string) {
    // returns promise ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(a: ArrayBuffer): string {
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

async function generateCodeChallengeFromVerifier(v: string): Promise<string> {
    const hashed: ArrayBuffer = await sha256(v);
    return base64urlencode(hashed);
}

function tokenExpired(token: string) {
    const expiry = (JSON.parse(atob(token.split('.')[1]))).exp;
    return (Math.floor((new Date).getTime() / 1000)) >= expiry;
}
