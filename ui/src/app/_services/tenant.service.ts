import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { SessionService } from './session.service';
import { RestApiModel } from '../component/model/RestApiModel';
import { DataModel, DataSource } from '../component/model/DataModel';

const API_URL = '/api';

/**
 * Custom exception for when no changes are made to a tenant
 */
export class NoChangesException extends Error {
    constructor(message: string = 'No changes have been made to the tenant') {
        super(message);
        this.name = 'NoChangesException';
    }
}

@Injectable({
    providedIn: 'root',
})
export class TenantService {
    constructor(
        private http: HttpClient,
        private sessionService: SessionService,
    ) {}

    getHttpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ' + this.sessionService.getToken()
            }),
        };
    }

    createTenant(name: string, domain: string) {
        return this.http.post(
            `${API_URL}/tenant/create`,
            {
                name,
                domain,
            },
            this.getHttpOptions(),
        );
    }

    editTenant(
        tenantId: string,
        name: null | string,
        allowSignUp: null | boolean,
    ) {
        // Create a request body object
        const requestBody: any = {};

        // Only add non-null parameters to the request body
        if (name !== null) {
            requestBody.name = name;
        }

        if (allowSignUp !== null) {
            requestBody.allowSignUp = allowSignUp;
        }

        // If all values are null, throw a specific exception
        if (Object.keys(requestBody).length === 0) {
            throw new NoChangesException();
        }

        return this.http.patch(
            `${API_URL}/tenant/${tenantId}`,
            requestBody,
            this.getHttpOptions(),
        );
    }

    deleteTenant(tenantId: string) {
        return lastValueFrom(
            this.http.delete(
                `${API_URL}/tenant/${tenantId}`,
                this.getHttpOptions(),
            ),
        );
    }

    async getTenantDetails(tenantId: string) {
        return lastValueFrom(
            this.http.get(
                `${API_URL}/tenant/${tenantId}`,
                this.getHttpOptions(),
            ),
        );
    }

    async getTenantCredentials(tenantId: string) {
        return lastValueFrom(
            this.http.get(
                `${API_URL}/tenant/${tenantId}/credentials`,
                this.getHttpOptions(),
            ),
        );
    }

    async getMembers(tenantId: string): Promise<any[]> {
        return (await lastValueFrom(
            this.http.get(
                `${API_URL}/tenant/${tenantId}/members`,
                this.getHttpOptions(),
            ),
        )) as Promise<any[]>;
    }

    async addMember(email: string, tenantId: string) {
        return lastValueFrom(
            this.http.post(
                `${API_URL}/tenant/${tenantId}/members/add`,
                {
                    emails: [email],
                },
                this.getHttpOptions(),
            ),
        );
    }

    async createRole(name: string, tenantId: string) {
        return lastValueFrom(
            this.http.post(
                `${API_URL}/tenant/${tenantId}/role/${name}`,
                {},
                this.getHttpOptions(),
            ),
        );
    }

    async removeMember(email: string, tenantId: string) {
        return lastValueFrom(
            this.http.delete(`${API_URL}/tenant/${tenantId}/member/delete`, {
                body: {
                    email: email,
                },
            }),
        );
    }

    async deleteRole(name: string, tenantId: string) {
        return lastValueFrom(
            this.http.delete(
                `${API_URL}/tenant/${tenantId}/role/${name}`,
                this.getHttpOptions(),
            ),
        );
    }

    async getMemberDetails(tenantId: string, userId: string) {
        return lastValueFrom(
            this.http.get(
                `${API_URL}/tenant/${tenantId}/member/${userId}`,
                this.getHttpOptions(),
            ),
        );
    }

    async getTenantRoles(tenantId: string): Promise<any> {
        return lastValueFrom(
            this.http.get(
                `${API_URL}/tenant/${tenantId}/roles`,
                this.getHttpOptions(),
            ),
        );
    }

    async queryTenant(query: any): Promise<any> {
        return (await lastValueFrom(
            this.http.post(
                `${API_URL}/search/Tenants`,
                query,
                this.getHttpOptions(),
            ),
        )) as any;
    }

    async replaceRoles(selectedRoles: any[], tenantId: string, userId: string) {
        const roles = selectedRoles.map((role) => role.name);
        return lastValueFrom(
            this.http.put(
                `${API_URL}/tenant/${tenantId}/member/${userId}/roles`,
                {
                    roles: roles,
                },
                this.getHttpOptions(),
            ),
        );
    }

    async addRolesToMember(
        selectedRoles: any[],
        tenantId: string,
        userId: string,
    ) {
        const roles = selectedRoles.map((role) => role.name);
        return lastValueFrom(
            this.http.post(
                `${API_URL}/tenant/${tenantId}/member/${userId}/roles/add`,
                {
                    roles: roles,
                },
                this.getHttpOptions(),
            ),
        );
    }

    async removeRolesFromMember(
        selectedRoles: any[],
        tenantId: string,
        userId: string,
    ) {
        const roles = selectedRoles.map((role) => role.name);
        return lastValueFrom(
            this.http.delete(
                `${API_URL}/tenant/${tenantId}/member/${userId}/roles/remove`,
                {
                    body: {
                        roles: roles,
                    },
                },
            ),
        );
    }

    createDataModel(initialData: any[]): DataSource<any> {
        return new RestApiModel(
            this.http,
            `${API_URL}/search/Tenants`,
            ['id'],
            ['Tenants'],
        );
    }
}
