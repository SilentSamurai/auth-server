import {Component, OnInit} from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {SessionService} from '../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {lastValueFrom} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

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
        });
    }

    async ngOnInit(): Promise<void> {

        const code_challenge = await this.tokenStorage.getCodeChallenge(this.code_challenge_method);

        // if auth code is present, then redirect
        // verify auth-code
        const authCode = this.tokenStorage.getAuthCode();
        if (authCode) {
            await this.redirect(authCode);
        }
        // else if (this.tokenStorage.isLoggedIn() && !externalLogin) {
        //     await this.router.navigateByUrl("/home");
        // }
        this.loading = false;
    }

    // redirection to home page might not work sometime,
    // check if internally anything is nav-ing to login page again
    async onSubmit(): Promise<void> {
        this.loading = true;
        const {username, password} = this.loginForm.value;
        const code_challenge = await this.tokenStorage.getCodeChallenge(this.code_challenge_method);
        try {
            const data = await this.authService.login(
                username,
                password,
                'auth.server.com',
                code_challenge,
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
        } finally {
            this.loading = false;
        }
    }

    async redirect(code: string) {
        await this.setAccessToken(code);
        await this.router.navigateByUrl("/home");
    }

    async onSigUpClick() {
        await this.router.navigate(['/register'], {
            queryParams: {
                client_id: 'auth.server.com',
            },
        });
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
}
