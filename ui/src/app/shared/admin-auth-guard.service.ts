import {Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import {Observable} from 'rxjs';
import {TokenStorageService} from "../_services/token-storage.service";
import {AuthDefaultService} from "../_services/auth.default.service";

@Injectable({
    providedIn: 'root'
})
export class AdminAuthGuard  {


    constructor(private tokenStorageService: TokenStorageService,
                private authDefaultService: AuthDefaultService,
                private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
        Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if (this.tokenStorageService.isLoggedIn() && this.tokenStorageService.isSuperAdmin()) {
            return true;
        }
        this.router.navigate(['/error', '403 unauthorized']);
        return false;
    }

}
