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
        client_id: null
    };
    loading = true;
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    roles: string[] = [];
    freezeClientId = false;
    redirectUri = "";
    code_challenge = "";

    isPasswordVisible = false;
    code_challenge_method: string = "plain";

    constructor(private authService: AuthService,
                private router: Router,
                private route: ActivatedRoute,
                private tokenStorage: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {

        let params = this.route.snapshot.queryParamMap;

        // code_challenge_method
        if (!params.has("code_challenge")) {
            alert("Invalid challenge");
            return;
        }
        this.code_challenge = params.get("code_challenge")!;

        if (!params.has("redirect_uri")) {
            alert("Invalid redirect_uri");
            return;
        }
        this.redirectUri = params.get("redirect_uri")!;

        if (params.has("client_id")) {
            this.form.client_id = params.get("client_id");
            if (this.form.client_id && this.form.client_id.length > 0) {
                this.freezeClientId = true;
            }
        }

        if (params.has("code_challenge_method")) {
            this.code_challenge_method = params.get("code_challenge_method")!;
        }

        // if auth code is present, then redirect
        // verify auth-code
        const authCode = this.tokenStorage.getAuthCode();
        if (authCode) {
            try {
                const data = await this.authService.validateAuthCode(authCode);
                if (data.status) {
                    await this.router.navigate(['session-confirm'], {
                        queryParams: {
                            redirect_uri: this.redirectUri,
                            client_id: this.form.client_id,
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
        this.freezeClientId = true;
    }

    // redirection to home page might not work sometime,
    // check if internally anything is nav-ing to login page again
    async onSubmit(): Promise<void> {
        const {email, password, client_id} = this.form;
        try {
            const data = await this.authService.login(
                email,
                password,
                client_id,
                this.code_challenge,
                this.code_challenge_method
            );
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
