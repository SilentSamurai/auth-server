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
        domain: "auth.server.com"
    };
    loading = true;
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    scopes: string[] = [];
    freezeDomain = true;
    redirectUri = "/home";
    code_challenge = "";

    isPasswordVisible = false;

    constructor(private authService: AuthService,
                private router: Router,
                private route: ActivatedRoute,
                private tokenStorage: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {

        let params = this.route.snapshot.queryParamMap;
        console.log(params, this.freezeDomain);
        this.code_challenge = await this.tokenStorage.getCodeChallenge();

        const externalLogin = params.has("redirect") && params.has("code_challenge") && params.has("domain");
        if (externalLogin) {
            this.form.domain = params.get("domain");
            this.redirectUri = params.get("redirect")!;
            this.code_challenge = params.get("code_challenge")!;
        }
        // if auth code is present, then redirect
        // verify auth-code
        const authCode = this.tokenStorage.getAuthCode();
        if (authCode) {
            try {
                const data = await this.authService.validateAuthCode(authCode);
                if (data.status) {
                    await this.router.navigate(['opt-page'], {
                        queryParams: {
                            redirect: this.redirectUri
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
        if (this.isAbsoluteUrl(this.redirectUri)) {
            window.location.href = `${this.redirectUri}?code=${code}`;
        } else {
            await this.router.navigate([this.redirectUri], {
                queryParams: {
                    code: code
                }
            });
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
