import {Inject, Injectable} from '@angular/core';
import {MongoAbility, PureAbility, subject} from '@casl/ability';
import {SessionService} from './session.service';

export enum Actions {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete',
    ReadCredentials = 'read-credential',
}

export const all_actions = [
    Actions.Manage,
    Actions.Create,
    Actions.Read,
    Actions.Update,
    Actions.Delete,
    Actions.ReadCredentials,
];

export enum Subjects {
    USER = 'User',
    TENANT = 'Tenant',
    ROLE = 'Role',
    GROUP = 'Group',
}

@Injectable({
    providedIn: 'root',
})
export class PermissionService {
    private readonly baseUrl = '/api/v1'; // match the prefix from PolicyClient

    constructor(
        @Inject(PureAbility) private ability: MongoAbility,
        private tokenStorage: SessionService,
    ) {
        const storedPermissions = this.tokenStorage.getPersistedPermissions();
        if (storedPermissions) {
            this.ability.update(storedPermissions);
        }
    }

    public isAuthorized(
        action: Actions,
        subjectStr: Subjects,
        condition: any = null,
    ): boolean {
        // console.log("[PermissionService] isAuthorized check:", {
        //     action,
        //     subject: subjectStr,
        //     condition
        // });
        let result: boolean;
        if (condition) {
            result = this.ability.can(action, subject(subjectStr, condition));
        } else {
            result = this.ability.can(action, subjectStr);
        }
        console.log(`[PermissionService] isAuthorized result:`, {
            action,
            subject: subjectStr,
            condition,
            result,
        });
        return result;
    }
}
