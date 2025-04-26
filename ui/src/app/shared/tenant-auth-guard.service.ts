import {Injectable} from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot,
    UrlTree,
} from '@angular/router';
import {Observable} from 'rxjs';
import {SessionService} from '../_services/session.service';
import {AuthDefaultService} from '../_services/auth.default.service';
import {
    Actions,
    PermissionService,
    Subjects,
} from '../_services/permission.service';

@Injectable({
    providedIn: 'root',
})
export class TenantAdminAuthGuardService {
    constructor(
        private tokenStorageService: SessionService,
        private authDefaultService: AuthDefaultService,
        private permissionService: PermissionService,
        private router: Router,
    ) {}

    check(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (!this.tokenStorageService.isLoggedIn()) {
            return false;
        }
        const tenantId = route.paramMap.get('tenantId');
        if (!tenantId) {
            return false;
        }
        if (
            !this.permissionService.isAuthorized(
                Actions.Manage,
                Subjects.TENANT,
                {tenantId},
            )
        ) {
            return true;
        }
        return true;
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
    ):
        | Observable<boolean | UrlTree>
        | Promise<boolean | UrlTree>
        | boolean
        | UrlTree {
        if (!this.check(route, state)) {
            // this.authDefaultService.signOut(state.url);
            return false;
        }
        return true;
    }
}

@Injectable({
    providedIn: 'root',
})
export class TenantAccessAuthGuard {
    constructor(
        private tokenStorageService: SessionService,
        private authDefaultService: AuthDefaultService,
        private permissionService: PermissionService,
        private router: Router,
    ) {}

    check(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (!this.tokenStorageService.isLoggedIn()) {
            return false;
        }
        const tenantId = route.paramMap.get('tenantId');
        console.log(route);
        if (!tenantId) {
            return false;
        }
        if (
            !this.permissionService.isAuthorized(
                Actions.Read,
                Subjects.TENANT,
                {tenantId},
            )
        ) {
            return true;
        }
        return true;
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
    ):
        | Observable<boolean | UrlTree>
        | Promise<boolean | UrlTree>
        | boolean
        | UrlTree {
        if (!this.check(route, state)) {
            // this.authDefaultService.signOut(state.url);
            return false;
        }
        return true;
    }
}
