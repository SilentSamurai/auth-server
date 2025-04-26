import {Injectable} from '@angular/core';
import {PureAbility} from '@casl/ability';
import {HttpClient} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';

// Interface to represent policy data
export interface Policy {
    id?: string;
    role?: string;
    effect?: string; // e.g. "ALLOW" or "DENY"
    action?: string; // e.g. "read", "update"
    subject?: string; // e.g. "orders" or "User"
    conditions?: any; // Optional conditions
}

@Injectable({
    providedIn: 'root',
})
export class PolicyService {
    private readonly baseUrl = '/api/v1'; // match the prefix from PolicyClient

    constructor(
        private ability: PureAbility,
        private http: HttpClient,
    ) {}

    // EXACT ENDPOINTS as used in PolicyClient:

    // 1) Create a policy
    public createAuthorization(
        role: string,
        effect: string,
        action: string,
        subject: string,
        conditions: any = {},
    ): Promise<Policy> {
        return lastValueFrom(
            this.http.post<Policy>(`${this.baseUrl}/policy/create`, {
                role,
                effect,
                action,
                subject,
                conditions,
            }),
        );
    }

    // 2) Get all authorizations for a particular role
    public getRoleAuthorizations(roleId: string): Promise<Policy[]> {
        return lastValueFrom(
            this.http.get<Policy[]>(`${this.baseUrl}/policy/byRole/${roleId}`),
        );
    }

    // 3) Get a single authorization (policy) by ID
    public getAuthorization(id: string): Promise<Policy> {
        return lastValueFrom(
            this.http.get<Policy>(`${this.baseUrl}/policy/${id}`),
        );
    }

    // 4) Update an existing policy
    public updateAuthorization(
        id: string,
        updateData: {
            effect?: string;
            action?: string;
            subject?: string;
            conditions?: object;
        },
    ): Promise<Policy> {
        return lastValueFrom(
            this.http.patch<Policy>(`${this.baseUrl}/policy/${id}`, updateData),
        );
    }

    // 5) Delete a policy
    public deleteAuthorization(id: string): Promise<any> {
        return lastValueFrom(this.http.delete(`${this.baseUrl}/policy/${id}`));
    }

    // 6) Get the current user’s permissions
    public getMyPermission(): Promise<any[]> {
        return lastValueFrom(
            this.http.get<any[]>(`${this.baseUrl}/my/permissions`),
        );
    }
}
