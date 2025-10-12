import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../_services/auth.service';
import {SessionService} from '../../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {lastValueFrom} from 'rxjs';
import {MessageService} from 'primeng/api';

@Component({
    selector: 'app-login',
    templateUrl: './authorize-login.component.html',
    styleUrls: ['./authorize-login.component.scss'],
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
