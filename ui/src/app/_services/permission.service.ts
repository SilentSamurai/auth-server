import {Injectable} from '@angular/core';
import {PureAbility} from "@casl/ability";
import {HttpClient} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';


export enum Actions {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete',
    ReadCredentials = 'read-credential',

}

export const all_actions = [
    Actions.Manage, Actions.Create, Actions.Read, Actions.Update, Actions.Delete, Actions.ReadCredentials,
]

export enum Subjects {
    USER = "User",
    TENANT = "Tenant",
    ROLE = "Role"
}

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private readonly baseUrl = '/api/v1'; // match the prefix from PolicyClient

    constructor(
        private ability: PureAbility
    ) {
    }

    public isAuthorized(action: Actions, subject: Subjects, condition: any = null): boolean {
        if (condition) {
            return this.ability.can(action, subject, condition);
        }
        return this.ability.can(action, subject);
    }


}
