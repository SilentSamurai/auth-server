import {Inject, Injectable} from '@angular/core';
import {MongoAbility, PureAbility, subject} from "@casl/ability";


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
        @Inject(PureAbility) private ability: MongoAbility
    ) {
    }

    public isAuthorized(action: Actions, subjectStr: Subjects, condition: any = null): boolean {
        console.log("isAuthorized action: ", action, " subject: ", subjectStr, " condition: ", condition);
        if (condition) {
            return this.ability.can(action, subject(subjectStr, condition));
        }
        return this.ability.can(action, subjectStr);
    }


}
