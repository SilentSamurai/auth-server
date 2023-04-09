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

    login(email: string, password: string, domain: string): Observable<any> {
        return this.http.post(`${AUTH_API}/token`, {
            email,
            password,
            domain
        }, httpOptions);
    }

    register(username: string, email: string, password: string): Observable<any> {
        return this.http.post(`${AUTH_API}/signup`, {
            username,
            email,
            password
        }, httpOptions);
    }
}
