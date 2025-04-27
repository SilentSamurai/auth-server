export interface AuthTenant {
    id: string;
    name: string;
    domain: string;
    client_id: string;
}

export interface AuthUser {
    sub: string;
    email: string;
    name: string;
    userId: string;
    tenant: AuthTenant;
    scopes: string[];
    grant_type: string;
    iat: number;
    exp: number;
    iss: string;
}

export class User implements AuthUser {
    sub: string;
    email: string;
    name: string;
    userId: string;
    tenant: AuthTenant;
    scopes: string[];
    grant_type: string;
    iat: number;
    exp: number;
    iss: string;

    constructor(init?: Partial<AuthUser>) {
        this.sub = init?.sub ?? '';
        this.email = init?.email ?? '';
        this.name = init?.name ?? '';
        this.userId = init?.userId ?? '';
        this.tenant = init?.tenant ?? {id: '', name: '', domain: '', client_id: ''};
        this.scopes = init?.scopes ?? [];
        this.grant_type = init?.grant_type ?? '';
        this.iat = init?.iat ?? 0;
        this.exp = init?.exp ?? 0;
        this.iss = init?.iss ?? '';
    }

    public isSuperAdmin(): boolean {
        return this.scopes.find((scope: string) => scope === "SUPER_ADMIN") !== undefined;
    }

    public isTenantAdmin(): boolean {
        return this.scopes.find((scope: string) => scope === "TENANT_ADMIN") !== undefined;
    }
}
