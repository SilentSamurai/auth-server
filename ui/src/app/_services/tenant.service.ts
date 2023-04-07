import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {TokenStorageService} from "./token-storage.service";

const API_URL = 'http://localhost:9000/';


@Injectable({
    providedIn: 'root'
})
export class TenantService {
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

    getAllTenants(): Observable<any> {
        return this.http.get(API_URL + 'tenant', this.getHttpOptions());
    }

    createTenant(name: string, domain: string) {
        return this.http.post(API_URL + 'tenant/create', {
            name,
            domain
        }, this.getHttpOptions());
    }

    editTenant(id: string, name: null | string, domain: null | string) {
        return this.http.put(API_URL + 'tenant/update', {
            id,
            name,
            domain
        }, this.getHttpOptions());
    }
}
