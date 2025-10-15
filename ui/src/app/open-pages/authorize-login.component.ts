import {Component, OnInit} from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {SessionService} from '../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {lastValueFrom} from 'rxjs';
import {MessageService} from 'primeng/api';

@Component({
    selector: 'app-login',
    template: `
<app-open-navbar></app-open-navbar>
<app-centered-card
    imageUrl="/assets/logo-img.jpg"
>
    <div *ngIf="loading" class="align-middle text-center" style="padding-top:25%">
        <div class="spinner-border m-5" role="status">
            <span class="sr-only">Loading...</span>
        </div>
    </div>

    <div *ngIf="!loading && error" class="alert alert-danger mt-3" role="alert">
        {{ error }}
    </div>

    <div *ngIf="!loading && !error" class="d-flex justify-content-center mt-2">
        <div class="py-1 px-2 mb-0">
            Authorizing
        </div>
    </div>

    <!-- Show client info below the image, similar to Sign Up page -->
    <div *ngIf="!loading && !error" class="d-flex justify-content-center">
        <div class="h5 py-1 px-2 mb-0">
            {{ clientId }}
        </div>
    </div>

    <!-- Use one FormGroup with conditional fields -->
    <form
        (ngSubmit)="loginForm.valid && onSubmit()"
        *ngIf="!isLoggedIn && !error"
        [formGroup]="loginForm"
        class="mt-3"
        novalidate
    >
        <!-- If client_id is frozen, show username/password inputs + Login button -->
        <div *ngIf="freezeClientId">
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
                        <i class="fa fas {{ !isPasswordVisible ? 'fa-eye' : 'fa-eye-slash' }}"></i>
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
                        id="login-btn">
                    Login
                </button>
            </div>

            <div *ngIf="isLoginFailed" class="alert alert-danger" role="alert">
                Login failed: {{ errorMessage }}
            </div>
        </div>
    </form>

    <!-- Show confirmation if user is logged in -->
    <div *ngIf="isLoggedIn" class="alert alert-success">
        Logged in as {{ loginForm.value?.username }}.
    </div>

    <div *ngIf="!loading && !error" class="d-flex justify-content-evenly">
        <a class="mt-1" href="https://silentsamurai.github.io/auth-server">
            Api Docs
        </a>

        <a
            id="signup-link"
            class="mt-1"
            [routerLink]="['/signup']"
            [queryParamsHandling]="'merge'"
        >
            Sign Up
        </a>
    </div>
</app-centered-card>
`,
    styles: [`
label { display: block; margin-top: 10px; }
.card-container.card { max-width: 400px !important; padding: 40px 40px; }
.card {
    background-color: var(--bs-card-bg, #f7f7f7);
    padding: 20px 25px 30px;
    margin: 0 auto 25px;
    margin-top: 50px;
    border-radius: 2px;
    box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.3);
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
}
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
export class AuthorizeLoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = true;
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    error = '';
    freezeClientId = false;
    redirectUri = '';
    code_challenge = '';
    isPasswordVisible = false;
    code_challenge_method: string = 'plain';
    clientId: string = '';
    state: string = '';
    scope: string = '';
    responseType: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private tokenStorage: SessionService,
        private messageService: MessageService
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
            this.error = 'Invalid challenge || challenge not found!';
            this.loading = false;
            return;
        }
        this.code_challenge = params.get('code_challenge')!;

        if (!params.has('redirect_uri')) {
            this.error = 'Invalid redirect_uri || redirect_uri not found';
            this.loading = false;
            return;
        }
        this.redirectUri = params.get('redirect_uri')!;

        if (!params.has('client_id')) {
            this.error = 'Invalid client_id || client_id not found';
            this.loading = false;
            return;
        }

        if (params.has('client_id')) {
            const cid = params.get('client_id');
            this.loginForm.patchValue({client_id: cid});
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
                const data = await this.authService.validateAuthCode(authCode, this.loginForm.get('client_id')?.value);
                if (data.status) {
                    await this.router.navigate(['session-confirm'], {
                        queryParams: {
                            redirect_uri: this.redirectUri,
                            client_id: this.loginForm.get('client_id')?.value,
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

        // Get query parameters
        this.route.queryParams.subscribe(params => {
            this.clientId = params['client_id'];
            this.state = params['state'];
            this.scope = params['scope'];
            this.responseType = params['response_type'];
        });
    }

    onContinue() {
        // this.loginForm.get('client_id')?.disable();
        this.freezeClientId = true;
    }

    // redirection to home page might not work sometime,
    // check if internally anything is nav-ing to login page again
    async onSubmit(): Promise<void> {
        this.loading = true;
        const {username, password, client_id} = this.loginForm.value;
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
            await this.onLoginSuccess(authenticationCode);
        } catch (err: any) {
            console.error(err);
            this.errorMessage = err.error.message;
            this.isLoginFailed = true;
        } finally {
            this.loading = false;
        }
    }

    async onLoginSuccess(authCode: string) {
        try {
            // Check for tenant ambiguity
            const ambiguityCheck = await lastValueFrom(
                this.authService.checkTenantAmbiguity(authCode, this.clientId)
            );

            if (ambiguityCheck.hasAmbiguity) {
                // Navigate to tenant selection with necessary data
                this.router.navigate(['/tenant-selection'], {
                    state: {
                        authCode: authCode,
                        clientId: this.clientId,
                        tenants: ambiguityCheck.tenants,
                        redirectUri: this.redirectUri,
                        state: this.state
                    }
                });
            } else {
                // No ambiguity, proceed with normal flow
                this.redirectToClient(authCode);
            }
        } catch (error) {
            console.error('Error checking tenant ambiguity:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to process authorization. Please try again.',
                life: 5000
            });
        }
    }

    private redirectToClient(authCode: string) {
        const redirectUrl = new URL(this.redirectUri);
        redirectUrl.searchParams.append('code', authCode);
        if (this.state) {
            redirectUrl.searchParams.append('state', this.state);
        }
        window.location.href = redirectUrl.toString();
    }

    // async onSigUpClick() {
    //     console.log(this.clientId);
    //     await this.router.navigate(['/signup'], {
    //         queryParams: {
    //             client_id: this.clientId,
    //         },
    //     });
    // }

    // protected isAbsoluteUrl(url: string): boolean {
    //     try {
    //         new URL(url);
    //         return true;
    //     } catch (error) {
    //         return false;
    //     }
    // }
}
