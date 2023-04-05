import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {TokenStorageService} from "./token-storage.service";

const API_URL = 'http://localhost:9000/';


@Injectable({
    providedIn: 'root'
})
export class UserService {
    constructor(private http: HttpClient, private tokenService: TokenStorageService) {
    }

    getHttpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.tokenService.getToken()
            })
        };
    }

    getPublicContent(): Observable<any> {
        return this.http.get(API_URL + 'all', {responseType: 'text'});
    }

    getAllUsers(): Observable<any> {
        return this.http.get(API_URL + 'users', this.getHttpOptions());
    }

    getModeratorBoard(): Observable<any> {
        return this.http.get(API_URL + 'mod', {responseType: 'text'});
    }

    getAdminBoard(): Observable<any> {
        return this.http.get(API_URL + 'admin', {responseType: 'text'});
    }
}
