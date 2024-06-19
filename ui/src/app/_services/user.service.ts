import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';
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

    createUser(name: string, email: string, password: string) {
        return lastValueFrom(this.http.post(`${API_URL}/users/create`, {
            name,
            email,
            password
        }, this.getHttpOptions()));
    }

    editUser(id: string, name: string, email: string, password: string) {
        return this.http.put(`${API_URL}/users/update`, {
            id,
            name,
            email,
            password
        }, this.getHttpOptions())
    }

    deleteUser(id: string) {
        return this.http.delete(`${API_URL}/users/${id}`, this.getHttpOptions())
    }

    getUser(email: string) {
        return this.http.get(`${API_URL}/users/${email}`, this.getHttpOptions());
    }

    getUserTenants(email: string) {
        return this.http.get(`${API_URL}/users/${email}/tenants`, this.getHttpOptions());
    }

    async queryUser(query: any): Promise<any> {
        return lastValueFrom(this.http.post(`${API_URL}/search/Users`, query, this.getHttpOptions()));
    }
}
