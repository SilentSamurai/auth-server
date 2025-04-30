import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';
import {SessionService} from './session.service';
import {RestApiModel} from '../component/model/RestApiModel';
import {DataSource, query} from "../component/model/DataModels";

const API_URL = '/api';

@Injectable({
    providedIn: 'root',
})
export class RoleService {
    constructor(
        private http: HttpClient,
        private sessionService: SessionService,
    ) {
    }

    getHttpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ' + this.sessionService.getToken()
            }),
        };
    }

    async updateRole(roleId: string, name: string, description: string) {
        return lastValueFrom(
            this.http.patch(
                `${API_URL}/role/${roleId}`,
                {
                    name,
                    description,
                },
                this.getHttpOptions(),
            ),
        );
    }

    async getRoleDetails(tenantId: string, roleId: string): Promise<any> {
        return lastValueFrom(
            this.http.get(`${API_URL}/role/${roleId}`, this.getHttpOptions()),
        );
    }

    createDataModel(): DataSource<any> {
        return new RestApiModel<any>(
            this.http,
            `${API_URL}/search/Roles`,
            ['id'],
            query({expand: ["Tenants"]}),
        );
    }
}
