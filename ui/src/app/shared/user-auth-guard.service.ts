import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {TokenStorageService} from "../_services/token-storage.service";
import {AuthDefaultService} from "../_services/auth.default.service";

@Injectable({
    providedIn: 'root'
})
export class UserAuthGuard implements CanActivate {


    constructor(private tokenStorageService: TokenStorageService,
                private authDefaultService: AuthDefaultService,
                private router: Router) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if (this.tokenStorageService.isLoggedIn()) {
            return true;
        }
        this.authDefaultService.signOut(state.url);
        return false;
    }

}
