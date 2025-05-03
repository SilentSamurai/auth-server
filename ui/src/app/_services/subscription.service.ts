import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';
import {SessionService} from './session.service';

const API_URL = '/api';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    constructor(
        private http: HttpClient
    ) {
    }

    getHttpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
        };
    }

    async subscribeToApp(appId: string, tenantId: string) {
        return lastValueFrom(
            this.http.post(
                `${API_URL}/apps/${appId}/subscribe`,
                {tenantId},
                this.getHttpOptions(),
            ),
        );
    }

    async unsubscribeFromApp(appId: string, tenantId: string) {
        return lastValueFrom(
            this.http.post(
                `${API_URL}/apps/${appId}/unsubscribe/${tenantId}`,
                {},
                this.getHttpOptions(),
            ),
        );
    }

    async getAppSubscriptions(appId: string) {
        return lastValueFrom(
            this.http.get(
                `${API_URL}/apps/${appId}/subscriptions`,
                this.getHttpOptions(),
            ),
        );
    }

    async getTenantSubscription(tenantId: string) {
        return lastValueFrom(
            this.http.get(`${API_URL}/apps/${tenantId}/subscriptions`)
        );
    }

}
