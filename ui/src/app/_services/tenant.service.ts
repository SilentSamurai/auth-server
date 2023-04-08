import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom, Observable} from 'rxjs';
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

    deleteTenant(id: string) {
        return lastValueFrom(this.http.delete(API_URL + 'tenant/' + id, this.getHttpOptions()))
    }

    async getTenantDetails(id: string) {
        return lastValueFrom(this.http.get(API_URL + 'tenant/' + id, this.getHttpOptions()))
    }

    async getMembers(id: string) {
        return lastValueFrom(this.http.get(`${API_URL}tenant/${id}/members`, this.getHttpOptions()))
    }

    async addMember(email: string, tenantId: string) {
        return lastValueFrom(this.http.post(`${API_URL}tenant/member`, {
            email, tenantId
        }, this.getHttpOptions()))
    }

    async addScope(name: string, tenantId: string) {
        return lastValueFrom(this.http.post(`${API_URL}scope/create`, {
            name, tenantId
        }, this.getHttpOptions()))
    }

    async assignScope(selectedScopes: any[], tenantId: string, email: string) {
        const scopes = selectedScopes.map(scope => scope.name);
        return lastValueFrom(this.http.post(`${API_URL}scope/member`, {
            email, scopes, tenantId,
        }, this.getHttpOptions()))
    }

    async removeMember(email: string, tenantId: string) {
        return lastValueFrom(this.http.delete(`${API_URL}tenant/${tenantId}/member/${email}`, this.getHttpOptions()))
    }

    async removeScope(id: string) {
        return lastValueFrom(this.http.delete(`${API_URL}scope/${id}`, this.getHttpOptions()))
    }
}
