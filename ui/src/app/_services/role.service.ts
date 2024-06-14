import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {TokenStorageService} from "./token-storage.service";

const API_URL = '/api';


@Injectable({
    providedIn: 'root'
})
export class RoleService {
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

    async getRoleDetails(tenantId: string, roleName: string): Promise<any> {

    }

    async deleteRole(tenantId: string, roleName: string): Promise<any> {

    }

    async removeUser(tenantId: string, roleName: string, users: any[]) {

    }

    async addUser(tenantId: string, roleName: string, users: any[]) {

    }
}
