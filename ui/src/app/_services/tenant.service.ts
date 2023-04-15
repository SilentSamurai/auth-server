import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom, Observable} from 'rxjs';
import {TokenStorageService} from "./token-storage.service";

const API_URL = '/api';


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
        return this.http.get(`${API_URL}/users/me/tenants`, this.getHttpOptions());
    }

    createTenant(name: string, domain: string) {
        return this.http.post(`${API_URL}/tenant/create`, {
            name,
            domain
        }, this.getHttpOptions());
    }

    editTenant(tenantId: string, name: null | string, domain: null | string) {
        return this.http.patch(`${API_URL}/tenant/${tenantId}`, {
            name,
            domain
        }, this.getHttpOptions());
    }

    deleteTenant(tenantId: string) {
        return lastValueFrom(this.http.delete(`${API_URL}/tenant/${tenantId}`, this.getHttpOptions()))
    }

    async getTenantDetails(tenantId: string) {
        return lastValueFrom(this.http.get(`${API_URL}/tenant/${tenantId}`, this.getHttpOptions()))
    }

    async getTenantCredentials(tenantId: string) {
        return lastValueFrom(this.http.get(`${API_URL}/tenant/credentials`, this.getHttpOptions()))
    }

    async getMembers(tenantId: string) {
        return lastValueFrom(this.http.get(`${API_URL}/tenant/${tenantId}/members`, this.getHttpOptions()))
    }

    async addMember(email: string, tenantId: string) {
        return lastValueFrom(this.http.post(`${API_URL}/tenant/${tenantId}/member/${email}`, {}, this.getHttpOptions()))
    }

    async addScope(name: string, tenantId: string) {
        return lastValueFrom(this.http.post(`${API_URL}/tenant/${tenantId}/scope/${name}`, {}, this.getHttpOptions()))
    }

    async assignScope(selectedScopes: any[], tenantId: string, email: string) {
        const scopes = selectedScopes.map(scope => scope.name);
        return lastValueFrom(this.http.put(`${API_URL}/tenant/${tenantId}/member/${email}/scope`, {
            scopes,
        }, this.getHttpOptions()))
    }

    async removeMember(email: string, tenantId: string) {
        return lastValueFrom(this.http.delete(`${API_URL}/tenant/${tenantId}/member/${email}`, this.getHttpOptions()))
    }

    async removeScope(name: string, tenantId: string) {
        return lastValueFrom(this.http.delete(`${API_URL}/tenant/${tenantId}/scope/${name}`, this.getHttpOptions()))
    }
}
