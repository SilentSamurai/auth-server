import {Injectable} from '@angular/core';
import {PureAbility} from "@casl/ability";


export enum Actions {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete',
    ReadCredentials = 'read-credential'
}

export enum Subjects {
    USER = "User",
    TENANT = "Tenant",
    ROLE = "Role"
}

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    constructor(private ability: PureAbility) {
    }

    public isAuthorized(action: Actions, subject: Subjects, condition: any = null) {
        if (condition) {
            return this.ability.can(action, subject, condition);
        }
        return this.ability.can(action, subject);
    }
}
