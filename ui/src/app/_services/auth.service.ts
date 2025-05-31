import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom, Observable} from 'rxjs';

const AUTH_API = '/api/oauth';

const httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'}),
};

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private http: HttpClient) {
    }

    async login(
        email: string,
        password: string,
        client_id: string,
        code_challenge: string,
        method: string,
    ): Promise<any> {
        return await lastValueFrom(
            this.http.post(
                `${AUTH_API}/login`,
                {
                    code_challenge: code_challenge,
                    code_challenge_method: method,
                    client_id,
                    email,
                    password,
                },
                httpOptions,
            ),
        );
    }

    fetchAccessToken(code: string, verifier: string, client_id: string): Observable<any> {
        return this.http.post(
            `${AUTH_API}/token`,
            {
                grant_type: 'authorization_code',
                code,
                code_verifier: verifier,
                client_id
            },
            httpOptions,
        );
    }

    async fetchPermissions(): Promise<any> {
        return await lastValueFrom(this.http.get('/api/v1/my/permissions'));
    }

    validateAuthCode(authCode: string, clientId: string): Promise<any> {
        return lastValueFrom(
            this.http.post(
                `${AUTH_API}/verify-auth-code`,
                {
                    auth_code: authCode,
                    client_id: clientId,
                },
                httpOptions,
            ),
        );
    }

    signUp(
        name: string,
        email: string,
        password: string,
        client_id: string,
    ): Promise<any> {
        return lastValueFrom(
            this.http.post(
                `api/signup`,
                {
                    name,
                    email,
                    password,
                    client_id,
                },
                httpOptions,
            ),
        );
    }

    registerTenant(
        name: string,
        email: string,
        password: string,
        orgName: string,
        domain: string,
    ): Promise<any> {
        return lastValueFrom(
            this.http.post(
                `api/register-domain`,
                {
                    name,
                    email,
                    password,
                    orgName,
                    domain,
                },
                httpOptions,
            ),
        );
    }
}
