import {AnyAbility} from "@casl/ability/dist/types/PureAbility";

export enum GRANT_TYPES {
    PASSWORD = "password",
    CLIENT_CREDENTIALS = "client_credentials",
    CLIENT_CREDENTIAL = "client_credential",
    REFRESH_TOKEN = "refresh_token",
    CODE = "authorization_code"
}

export class ChangeEmailToken {
    sub: string;
    updatedEmail: string;
}

export class ResetPasswordToken {
    sub: string;
}

export class EmailVerificationToken {
    sub: string;
}

export class RefreshToken {
    email: string;
    domain: string
}

export class OAuthToken {
    sub: string;
    scopes: string[];
    grant_type: GRANT_TYPES
}

export class UserToken extends OAuthToken {
    email: string;
    name: string;
    userId: string;
}

export class TenantToken extends UserToken {
    tenant?: {
        id: string;
        name: string;
        domain: string;
    };
}


export class TechnicalToken extends TenantToken {
    isTechnical: boolean = true;
}

export class AuthContext {
    SCOPE_ABILITIES: AnyAbility;
    SECURITY_CONTEXT: TenantToken;
}