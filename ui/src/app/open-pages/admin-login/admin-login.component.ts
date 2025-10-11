import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../_services/auth.service';
import {SessionService} from '../../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {lastValueFrom} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MessageService} from 'primeng/api';

@Component({
    selector: 'app-admin-login',
    templateUrl: './admin-login.component.html',
    styleUrls: ['./admin-login.component.scss'],
})
export class AdminLoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = true;
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    isPasswordVisible = false;
    code_challenge_method: string = 'plain';
    // Preserve default client id behaviour for admin login
    client_id: string = 'auth.server.com';

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private tokenStorage: SessionService,
        private messageService: MessageService,
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }

    async ngOnInit(): Promise<void> {
        let params = this.route.snapshot.queryParamMap;
        if (params.has('client_id')) {
            this.client_id = params.get('client_id')!;
        }

        const code_challenge = await this.tokenStorage.getCodeChallenge(this.code_challenge_method);

        const authCode = this.tokenStorage.getAuthCode();
        if (authCode) {
            await this.redirect(authCode);
        }
        this.loading = false;
    }

    async onSubmit(): Promise<void> {
        this.loading = true;
        const {username, password} = this.loginForm.value;
        const code_challenge = await this.tokenStorage.getCodeChallenge(this.code_challenge_method);
        try {
            const data = await this.authService.login(
                username,
                password,
                this.client_id,
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
        await this.setAccessToken(code, this.client_id);
        await this.router.navigateByUrl('/home');
    }

    async onSigUpClick() {
        await this.router.navigate(['/register'], {
            queryParams: {
                client_id: 'auth.server.com',
            },
        });
    }

    private async setAccessToken(code: string, clientId: string) {
        try {
            let verifier = this.tokenStorage.getCodeVerifier();
            const data = await lastValueFrom(
                this.authService.fetchAccessToken(code, verifier, clientId),
            );
            this.tokenStorage.saveToken(data.access_token);
            const rules = await this.authService.fetchPermissions();
            this.tokenStorage.savePermissions(rules);
        } catch (e: any) {
            console.error(e);
            this.messageService.add({
                severity: 'error',
                summary: 'Authentication Error',
                detail: 'Failed to fetch access token. Please try logging in again.',
                life: 5000
            });
        }
    }
}
