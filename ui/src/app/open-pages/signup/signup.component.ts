import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {AuthService} from '../../_services/auth.service';
import {AuthDefaultService} from '../../_services/auth.default.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    providers: [MessageService]
})
export class SignUpComponent implements OnInit {
    signupForm!: FormGroup;
    isSignUpFailed = false;
    errorMessage = '';
    loading = false;
    currentStep = 1;
    hasClientIdPreset = false;
    isSuccessful = false;

    constructor(
        private fb: FormBuilder,
        private actRoute: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private authDefaultService: AuthDefaultService,
        private messageService: MessageService
    ) {
    }

    ngOnInit(): void {
        this.signupForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            client_id: ['', [Validators.required]]
        });

        // React to query param changes to handle same-route navigation updates
        this.actRoute.queryParamMap.subscribe(params => {
            const clientIdParam = params.get('client_id');
            if (clientIdParam && clientIdParam.length > 0) {
                if (this.signupForm.get('client_id')?.value !== clientIdParam) {
                    this.signupForm.patchValue({client_id: clientIdParam});
                }
                this.hasClientIdPreset = true;
                this.currentStep = 2; // jump directly to details when client_id present
            } else {
                this.hasClientIdPreset = false;
                this.currentStep = 1;
                // clear client id if removed from URL
                this.signupForm.get('client_id')?.reset('');
            }
        });
    }

    async onSubmit(): Promise<void> {
        // If on step 1, only move to step 2 after validating client_id
        if (this.currentStep === 1) {
            const ctrl = this.signupForm.get('client_id');
            if (!ctrl || ctrl.invalid) {
                ctrl?.markAsTouched();
                return;
            }
            this.currentStep = 2;
            return;
        }

        if (this.signupForm.invalid) return;

        const {name, email, password, client_id} = this.signupForm.value;
        this.isSignUpFailed = false;
        this.loading = true;

        try {
            await this.authService.signUp(name, email, password, client_id);

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Sign up successful! Please verify your email, then try logging in again.'
            });
            this.isSuccessful = true;
            // Do not redirect; keep user on this page to read instructions
        } catch (e: any) {
            console.error(e);
            const msg = e?.error?.message || e?.message || 'Registration failed. Please try again.';
            this.isSignUpFailed = true;
            this.errorMessage = msg;
            this.messageService.add({severity: 'error', summary: 'Error', detail: msg});
        } finally {
            this.loading = false;
        }
    }

    onNextClick(): void {
        const ctrl = this.signupForm.get('client_id');
        if (!ctrl || ctrl.invalid) {
            ctrl?.markAsTouched();
            return;
        }
        // Redirect to /signup with client_id as query param so the component reacts via subscription
        const clientId = ctrl.value;
        this.router.navigate(['/signup'], {queryParams: {client_id: clientId}});
        // Optimistically move to step 2 for immediate UX
        this.currentStep = 2;
        this.hasClientIdPreset = true;
    }
}
