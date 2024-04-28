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
        this.tokenStorageService.clearSession();
        await this.navToLogin(redirect);
    }

    public async navToLogin(redirect: string): Promise<void> {
        let code_challenge = await this.tokenStorageService.getCodeChallenge();
        await this.router.navigate(['login'], {
            queryParams: {
                redirect: redirect,
                domain: 'auth.server.com',
                code_challenge: code_challenge
            }
        });
    }


}



