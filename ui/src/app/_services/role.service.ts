import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom, Observable} from 'rxjs';
import {TokenStorageService} from "./token-storage.service";
import {DataModel} from "../component/model/DataModel";
import {RestApiModel} from "../component/model/RestApiModel";

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
        return lastValueFrom(this.http.get(`${API_URL}/tenant/${tenantId}/role/${roleName}`, this.getHttpOptions()));
    }

    async deleteRole(tenantId: string, roleName: string): Promise<any> {

    }

    async removeUser(tenantId: string, roleName: string, users: any[]) {

    }

    async addUser(tenantId: string, roleName: string, users: any[]) {

    }

    async queryRoles(query: any): Promise<any> {
        return await lastValueFrom(this.http.post(`${API_URL}/search/Roles`, query, this.getHttpOptions())) as any;
    }

    createDataModel(initialData: any[]): DataModel {
        let restApiModel = new RestApiModel(
            this.http,
            `${API_URL}/search/Roles`,
            ["id"],
            initialData
        );
        restApiModel.expands(['Tenants'])
        return restApiModel;
    }
}
