import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from './session.service';

@Injectable({
    providedIn: 'root',
})
export class AuthDefaultService {
    public title: string = 'Home';

    constructor(
        private router: Router,
        private sessionService: SessionService,
    ) {}

    async signOut(redirect: string): Promise<void> {
        const userInfo = this.sessionService.getUser();
        this.sessionService.clearSession();
        if (userInfo) {
            await this.navToLogin(redirect, userInfo.tenant.client_id);
        } else {
            await this.navToLogin(redirect, null);
        }
    }

    public async navToLogin(
        redirect: string,
        client_id: string | null,
    ): Promise<void> {
        let code_challenge =
            await this.sessionService.getCodeChallenge('plain');
        if (client_id) {
            await this.router.navigate(['login'], {
                queryParams: {
                    redirect_uri: redirect,
                    client_id: client_id,
                    code_challenge: code_challenge,
                },
            });
        } else {
            await this.router.navigate(['login'], {
                queryParams: {
                    redirect_uri: redirect,
                    code_challenge: code_challenge,
                },
            });
        }
    }

    resetTitle() {
        this.title = 'Home';
    }

    setTitle(title: string) {
        this.title = title;
    }
}
