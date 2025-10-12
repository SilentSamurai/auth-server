import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../_services/auth.service';
import {SessionService} from '../../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {lastValueFrom} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MessageService} from 'primeng/api';

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
    isPasswordVisible = false;
    code_challenge_method: string = 'plain';
    client_id: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private tokenStorage: SessionService,
        private messageService: MessageService,
    ) {
        this.loginForm = this.fb.group({
            client_id: ['', Validators.required],
            username: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }

    async ngOnInit(): Promise<void> {
        let params = this.route.snapshot.queryParamMap;
        if (params.has('client_id')) {
            this.client_id = params.get('client_id')!;
            this.loginForm.get('client_id')?.setValue(this.client_id);
            if (this.client_id && this.client_id.length > 0) {
                this.freezeClientId = true;
            }
        }

        const code_challenge = await this.tokenStorage.getCodeChallenge(this.code_challenge_method);

        // if auth code is present, then redirect
        // verify auth-code
        const authCode = this.tokenStorage.getAuthCode();
        if (authCode) {
            const clientId = this.client_id || this.loginForm.get('client_id')?.value;
            if (clientId) {
                await this.redirect(authCode, clientId);
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
        this.loading = true;
        const {username, password} = this.loginForm.value;
        const clientId = this.client_id || this.loginForm.get('client_id')?.value;
        if (!clientId) {
            this.loginForm.get('client_id')?.markAsTouched();
            this.loading = false;
            return;
        }
        const code_challenge = await this.tokenStorage.getCodeChallenge(this.code_challenge_method);
        try {
            const data = await this.authService.login(
                username,
                password,
                clientId,
                code_challenge,
                this.code_challenge_method,
            );
            let authenticationCode = data.authentication_code;
            this.isLoginFailed = false;
            this.isLoggedIn = true;
            this.tokenStorage.saveAuthCode(authenticationCode);
            await this.redirect(authenticationCode, clientId);
        } catch (err: any) {
            console.error(err);
            this.errorMessage = err.error.message;
            this.isLoginFailed = true;
        } finally {
            this.loading = false;
        }
    }

    async redirect(code: string, clientId: string) {
        await this.setAccessToken(code, clientId);
        await this.router.navigate(["/home"], {
            queryParams: { client_id: clientId },
        });
    }

    onContinue() {
        const clientIdCtrl = this.loginForm.get('client_id');
        const clientId = (clientIdCtrl?.value || '').trim();
        if (!clientId) {
            clientIdCtrl?.markAsTouched();
            return;
        }
        this.client_id = clientId;
        this.freezeClientId = true;
        // Update URL with client_id without reloading the component
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { client_id: clientId },
            queryParamsHandling: 'merge',
        });
    }

    async onSigUpClick() {
        const clientId = this.client_id || this.loginForm.get('client_id')?.value;
        await this.router.navigate(['/register'], {
            queryParams: {
                client_id: clientId,
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
