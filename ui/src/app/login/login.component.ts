import {Component, OnInit} from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {TokenStorageService} from '../_services/token-storage.service';
import {ActivatedRoute, Router} from "@angular/router";
import {lastValueFrom} from "rxjs";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    form: any = {
        email: null,
        password: null,
        domain: null
    };
    loading = true;
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    roles: string[] = [];
    freezeDomain = false;
    redirectUri = "";
    code_challenge = "";

    isPasswordVisible = false;

    constructor(private authService: AuthService,
                private router: Router,
                private route: ActivatedRoute,
                private tokenStorage: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {

        let params = this.route.snapshot.queryParamMap;

        if (!params.has("code_challenge")) {
            alert("Invalid challenge");
            return;
        }
        if (params.has("domain")) {
            this.form.domain = params.get("domain");
            if (this.form.domain && this.form.domain.length > 0) {
                this.freezeDomain = true;
            }
        }

        this.redirectUri = params.get("redirect")!;
        this.code_challenge = params.get("code_challenge")!;

        // if auth code is present, then redirect
        // verify auth-code
        const authCode = this.tokenStorage.getAuthCode();
        if (authCode) {
            try {
                const data = await this.authService.validateAuthCode(authCode);
                if (data.status) {
                    await this.router.navigate(['session-confirm'], {
                        queryParams: {
                            redirect: this.redirectUri,
                            domain: this.form.domain,
                            code_challenge: this.code_challenge
                        }
                    });
                }
            } catch (e: any) {
                console.error(e);
            }
        }
        // else if (this.tokenStorage.isLoggedIn() && !externalLogin) {
        //     await this.router.navigateByUrl("/home");
        // }
        this.loading = false;
    }

    onContinue() {
        this.freezeDomain = true;
    }

    // redirection to home page might not work sometime,
    // check if internally anything is nav-ing to login page again
    async onSubmit(): Promise<void> {
        const {email, password, domain} = this.form;
        try {
            const data = await lastValueFrom(this.authService.login(email, password, domain, this.code_challenge));
            let authenticationCode = data.authentication_code;
            this.isLoginFailed = false;
            this.isLoggedIn = true;
            this.tokenStorage.saveAuthCode(authenticationCode);
            await this.redirect(authenticationCode);
        } catch (err: any) {
            console.error(err);
            this.errorMessage = err.error.message;
            this.isLoginFailed = true;
        }

    }

    async redirect(code: string) {
        if (this.redirectUri.length <= 0) {
            return
        }

        if (this.isAbsoluteUrl(this.redirectUri)) {
            // redirecting else where
            window.location.href = `${this.redirectUri}?code=${code}`;
        } else {
            // redirecting internally
            await this.setAccessToken(code);
            await this.router.navigateByUrl(this.redirectUri);
        }
    }

    private async setAccessToken(code: string) {
        try {
            let verifier = this.tokenStorage.getCodeVerifier();
            const data = await lastValueFrom(this.authService.getAccessToken(code, verifier));
            this.tokenStorage.saveToken(data.access_token);
            const rules = await this.authService.getPermissions();
            this.tokenStorage.updatePermissions(rules);
        } catch (e: any) {
            console.error(e);
        }
    }

    protected isAbsoluteUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }
}
