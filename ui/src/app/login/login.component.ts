import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { SessionService } from '../_services/session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = true;
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    freezeClientId = false;
    redirectUri = '';
    code_challenge = '';
    isPasswordVisible = false;
    code_challenge_method: string = 'plain';

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private tokenStorage: SessionService,
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
            client_id: ['', Validators.required],
        });
    }

    async ngOnInit(): Promise<void> {
        let params = this.route.snapshot.queryParamMap;

        // code_challenge_method
        if (!params.has('code_challenge')) {
            alert('Invalid challenge || challenge not found!');
            return;
        }
        this.code_challenge = params.get('code_challenge')!;

        if (!params.has('redirect_uri')) {
            alert('Invalid redirect_uri || redirect_uri not found');
            return;
        }
        this.redirectUri = params.get('redirect_uri')!;

        if (params.has('client_id')) {
            const cid = params.get('client_id');
            this.loginForm.patchValue({ client_id: cid });
            if (cid && cid.length > 0) {
                this.freezeClientId = true;
            }
        }

        if (params.has('code_challenge_method')) {
            this.code_challenge_method = params.get('code_challenge_method')!;
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
                            client_id: this.loginForm.get('client_id'),
                            code_challenge: this.code_challenge,
                        },
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
        // this.loginForm.get('client_id')?.disable();
        this.freezeClientId = true;
    }

    // redirection to home page might not work sometime,
    // check if internally anything is nav-ing to login page again
    async onSubmit(): Promise<void> {
        const { username, password, client_id } = this.loginForm.value;
        try {
            const data = await this.authService.login(
                username,
                password,
                client_id,
                this.code_challenge,
                this.code_challenge_method,
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
            return;
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
            const data = await lastValueFrom(
                this.authService.fetchAccessToken(code, verifier),
            );
            this.tokenStorage.saveToken(data.access_token);
            const rules = await this.authService.fetchPermissions();
            this.tokenStorage.savePermissions(rules);
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

    async onSigUpClick() {
        await this.router.navigate(['/register'], {
            queryParams: {
                client_id: this.loginForm.get('client_id')?.value!,
            },
        });
    }
}
