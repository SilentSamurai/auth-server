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
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    scopes: string[] = [];
    freezeDomain = true;
    redirectUri = "/home";
    code_challenge = "";

    constructor(private authService: AuthService,
                private router: Router,
                private route: ActivatedRoute,
                private tokenStorage: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {

        let params = this.route.snapshot.queryParamMap;
        console.log(params, this.freezeDomain);
        this.code_challenge = await this.tokenStorage.getCodeChallenge();

        const externalLogin = params.has("redirect_uri") && params.has("code_challenge") && params.has("domain");
        if (externalLogin) {
            this.form.domain = params.get("domain");
            this.redirectUri = params.get("redirect_uri")!;
            this.code_challenge = params.get("code_challenge")!;
        }


        if (this.tokenStorage.isLoggedIn()) {
            if (!externalLogin) {
                await this.router.navigateByUrl("/home");
                return;
            } else {
                let user = this.tokenStorage.getUser();
                if (user.tenant.domain == params.get("domain")) {
                    try {
                        let codeChallenge = params.get("code_challenge")!;
                        let token = this.tokenStorage.getToken()!;
                        const code = await lastValueFrom(this.authService.getAuthCode(token, codeChallenge));
                        await this.redirect(code.authentication_code);
                        return;
                    } catch (e: any) {
                    }
                }
                // this.tokenStorage.signOut();
            }
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

    async onSubmit(): Promise<void> {
        const {email, password, domain} = this.form;
        try {
            const data = await lastValueFrom(this.authService.login(email, password, domain, this.code_challenge));
            let authenticationCode = data.authentication_code;
            this.isLoginFailed = false;
            this.isLoggedIn = true;
            await this.redirect(authenticationCode);
        } catch (err: any) {
            console.error(err);
            this.errorMessage = err.error.message;
            this.isLoginFailed = true;
        }

    }

    protected isAbsoluteUrl(url: string): boolean {
        try {
            const absoluteUrl = new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }
}
