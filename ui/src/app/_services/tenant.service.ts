import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';
import {TokenStorageService} from "./token-storage.service";
import {RestApiModel} from "../component/model/RestApiModel";
import {DataModel} from "../component/model/DataModel";

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
                // 'Authorization': 'Bearer ' + this.tokenService.getToken()
            })
        };
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
        return lastValueFrom(this.http.get(`${API_URL}/tenant/${tenantId}/credentials`, this.getHttpOptions()))
    }

    async getMembers(tenantId: string): Promise<any[]> {
        return await lastValueFrom(this.http.get(`${API_URL}/tenant/${tenantId}/members`, this.getHttpOptions())) as Promise<any[]>
    }

    async addMember(email: string, tenantId: string) {
        return lastValueFrom(this.http.post(`${API_URL}/tenant/${tenantId}/members/add`, {
            emails: [email]
        }, this.getHttpOptions()))
    }

    async createRole(name: string, tenantId: string) {
        return lastValueFrom(this.http.post(`${API_URL}/tenant/${tenantId}/role/${name}`, {}, this.getHttpOptions()))
    }

    async removeMember(email: string, tenantId: string) {
        return lastValueFrom(this.http.delete(`${API_URL}/tenant/${tenantId}/member/delete`, {
            body: {
                email: email,
            }
        }))
    }

    async deleteRole(name: string, tenantId: string) {
        return lastValueFrom(this.http.delete(`${API_URL}/tenant/${tenantId}/role/${name}`, this.getHttpOptions()))
    }

    async getMemberDetails(tenantId: string, userId: string) {
        return lastValueFrom(this.http.get(`${API_URL}/tenant/${tenantId}/member/${userId}`, this.getHttpOptions()))
    }

    async getTenantRoles(tenantId: string): Promise<any> {
        return lastValueFrom(this.http.get(`${API_URL}/tenant/${tenantId}/roles`, this.getHttpOptions()))
    }

    async queryTenant(query: any): Promise<any> {
        return await lastValueFrom(this.http.post(`${API_URL}/search/Tenants`, query, this.getHttpOptions())) as any;
    }

    async replaceRoles(selectedRoles: any[], tenantId: string, userId: string) {
        const roles = selectedRoles.map(role => role.name);
        return lastValueFrom(this.http.put(`${API_URL}/tenant/${tenantId}/member/${userId}/roles`, {
            roles: roles,
        }, this.getHttpOptions()))
    }

    async addRolesToMember(selectedRoles: any[], tenantId: string, userId: string) {
        const roles = selectedRoles.map(role => role.name);
        return lastValueFrom(this.http.post(`${API_URL}/tenant/${tenantId}/member/${userId}/roles/add`, {
            roles: roles,
        }, this.getHttpOptions()))
    }

    async removeRolesFromMember(selectedRoles: any[], tenantId: string, userId: string) {
        const roles = selectedRoles.map(role => role.name);
        return lastValueFrom(this.http.delete(`${API_URL}/tenant/${tenantId}/member/${userId}/roles/remove`, {
            body: {
                roles: roles,
            }
        }))
    }

    createDataModel(initialData: any[]): DataModel {
        return new RestApiModel(
            this.http,
            `${API_URL}/search/Tenants`,
            ["id"],
            initialData
        );
    }
}
