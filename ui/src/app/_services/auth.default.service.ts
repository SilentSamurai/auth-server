import {Injectable} from '@angular/core';
import {Router} from "@angular/router";
import {TokenStorageService} from "./token-storage.service";

@Injectable({
    providedIn: 'root'
})
export class AuthDefaultService {
    constructor(private router: Router,
                private tokenStorageService: TokenStorageService) {
    }

    async signOut(redirect: string): Promise<void> {
        const userInfo = this.tokenStorageService.getUser();
        this.tokenStorageService.clearSession();
        if (userInfo) {
            await this.navToLogin(redirect, userInfo.tenant.domain);
        } else {
            await this.navToLogin(redirect, null);
        }
    }

    public async navToLogin(redirect: string, domain: string | null): Promise<void> {
        let code_challenge = await this.tokenStorageService.getCodeChallenge();
        if (domain) {
            await this.router.navigate(['login'], {
                queryParams: {
                    redirect: redirect,
                    domain: domain,
                    code_challenge: code_challenge
                }
            });
        } else {
            await this.router.navigate(['login'], {
                queryParams: {
                    redirect: redirect,
                    code_challenge: code_challenge
                }
            });
        }

    }


}



