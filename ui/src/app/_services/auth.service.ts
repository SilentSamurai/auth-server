import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

const AUTH_API = '/api/oauth';

const httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private http: HttpClient) {
    }

    login(email: string, password: string, domain: string, code_challenge: string): Observable<any> {
        return this.http.post(`${AUTH_API}/login`, {
            code_challenge: code_challenge,
            email,
            password,
            domain
        }, httpOptions);
    }

    getAccessToken(code: string, verifier: string): Observable<any> {
        return this.http.post(`${AUTH_API}/token`, {
            grant_type: "authorization_code",
            code,
            code_verifier: verifier
        }, httpOptions);
    }

    getAuthCode(accessToken: string, challenge: string): Observable<any> {
        return this.http.post(`${AUTH_API}/gen-auth-code`, {
            access_token: accessToken,
            code_challenge: challenge
        }, httpOptions);
    }

    register(name: string, email: string, password: string): Observable<any> {
        return this.http.post(`api/users/signup`, {
            name,
            email,
            password
        }, httpOptions);
    }
}
