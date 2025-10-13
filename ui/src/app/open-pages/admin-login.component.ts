import {Component, OnInit} from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {SessionService} from '../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {lastValueFrom} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MessageService} from 'primeng/api';

@Component({
    selector: 'app-admin-login',
    template: `
<app-open-navbar></app-open-navbar>
<app-centered-card
    [title]="client_id"
    imageUrl="/assets/logo-img.jpg"
>
    <div *ngIf="loading" class="align-middle text-center" style="padding-top:25%">
        <div class="spinner-border m-5" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>

    <form
        (ngSubmit)="loginForm.valid && onSubmit()"
        *ngIf="!isLoggedIn"
        [formGroup]="loginForm"
        class="mt-3"
        novalidate
    >
        <div class="form-group">
            <label for="username">Username</label>
            <div class="input-group">
                <span class="input-group-text">&#64;</span>
                <input
                    class="form-control"
                    formControlName="username"
                    id="username"
                    placeholder="Enter Username / Email"
                    type="text"
                />
            </div>
            <div
                *ngIf="loginForm.get('username')?.errors && (loginForm.get('username')?.touched || loginForm.get('username')?.dirty)"
                class="alert alert-danger mt-2"
                role="alert">
                Username is required
            </div>
        </div>

        <div class="form-group mt-3">
            <label for="password">Password</label>
            <div class="input-group">
                <input
                    [type]="isPasswordVisible ? 'text' : 'password'"
                    class="form-control"
                    formControlName="password"
                    id="password"
                    minlength="6"
                    placeholder="Password"
                />
                <button
                    (click)="isPasswordVisible = !isPasswordVisible"
                    class="input-group-text"
                    type="button"
                >
                    <i class="fas {{ !isPasswordVisible ? 'fa-eye' : 'fa-eye-slash' }}"></i>
                </button>
            </div>
            <div
                *ngIf="loginForm.get('password')?.errors && (loginForm.get('password')?.touched || loginForm.get('password')?.dirty)"
                class="alert alert-danger mt-2"
                role="alert">
                <div *ngIf="loginForm.get('password')?.errors?.['required']">
                    Password is required
                </div>
                <div *ngIf="loginForm.get('password')?.errors?.['minlength']">
                    Password must be at least 6 characters
                </div>
            </div>
        </div>

        <div class="form-group d-grid gap-2 py-3">
            <button [disabled]="loginForm.invalid"
                    class="btn btn-primary btn-block btn-lg"
                    type="submit"
                    id="login-btn">
                Login
            </button>
        </div>

        <div *ngIf="isLoginFailed" class="alert alert-danger" role="alert">
            Login failed: {{ errorMessage }}
        </div>
    </form>

    <div *ngIf="isLoggedIn" class="alert alert-success">
        Logged in as {{ loginForm.value?.username }}.
    </div>

    <div class="d-flex justify-content-evenly">
        <a class="mt-1" href="https://silentsamurai.github.io/auth-server">
            Api Docs
        </a>

        <a class="mt-1" routerLink="/forgot-password">
            Forgot Password
        </a>

        <a class="mt-1" routerLink="/register">
            Sign Up
        </a>
    </div>
</app-centered-card>
`,
    styles: [`
/* Styles specific to Admin Login page */
:host { display: block; }

/* Dark mode specific styles */
[data-bs-theme="dark"] .card {
  background-color: var(--bs-dark, #212529);
  border-color: var(--bs-border-color, #495057);
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.5);
}
[data-bs-theme="dark"] .form-control {
  background-color: var(--bs-dark, #212529);
  border-color: var(--bs-border-color, #495057);
  color: var(--bs-body-color, #f8f9fa);
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
[data-bs-theme="dark"] .form-control:focus {
  background-color: var(--bs-dark, #212529);
  border-color: var(--bs-primary, #0d6efd);
  color: var(--bs-body-color, #f8f9fa);
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
[data-bs-theme="dark"] .form-control:hover { border-color: var(--bs-primary, #0d6efd); }
[data-bs-theme="dark"] .input-group-text {
  background-color: var(--bs-dark, #212529);
  border-color: var(--bs-border-color, #495057);
  color: var(--bs-body-color, #f8f9fa);
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
[data-bs-theme="dark"] label { color: var(--bs-body-color, #f8f9fa); transition: color 0.3s ease; }
[data-bs-theme="dark"] .alert-danger {
  background-color: var(--bs-danger-bg-subtle, rgba(220, 53, 69, 0.15));
  border-color: var(--bs-danger-border-subtle, rgba(220, 53, 69, 0.3));
  color: var(--bs-danger-text-emphasis, #ea868f);
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
[data-bs-theme="dark"] .alert-success {
  background-color: var(--bs-success-bg-subtle, rgba(25, 135, 84, 0.15));
  border-color: var(--bs-success-border-subtle, rgba(25, 135, 84, 0.3));
  color: var(--bs-success-text-emphasis, #75b798);
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
[data-bs-theme="dark"] a { color: var(--bs-link-color, #0d6efd); transition: color 0.3s ease; }
[data-bs-theme="dark"] a:hover { color: var(--bs-link-hover-color, #0a58ca); text-decoration: underline; }
[data-bs-theme="dark"] .btn-primary {
  background-color: var(--bs-primary, #0d6efd);
  border-color: var(--bs-primary, #0d6efd);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
[data-bs-theme="dark"] .btn-primary:hover { background-color: var(--bs-primary-dark, #0b5ed7); border-color: var(--bs-primary-dark, #0b5ed7); }
[data-bs-theme="dark"] .btn-primary:focus { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); }
`],
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
