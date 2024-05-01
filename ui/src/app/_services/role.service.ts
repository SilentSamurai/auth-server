import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {TokenStorageService} from "./token-storage.service";

const API_URL = '/api';


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
                // 'Authorization': 'Bearer ' + this.tokenService.getToken()
            })
        };
    }

    getAllRoles(): Observable<any> {
        return this.http.get(`${API_URL}/roles`, this.getHttpOptions());
    }
}
