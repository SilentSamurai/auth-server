import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthDefaultService} from '../_services/auth.default.service';
import {AuthService} from '../_services/auth.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
    // Reactive form
    registerForm!: FormGroup;

    // Additional states
    isSuccessful = false;
    isSignUpFailed = false;
    errorMessage = '';
    loading = false;

    isSignUp = false;
    clientId?: string;

    // For multi-step flow (if !isSignUp)
    currentStep = 1;

    constructor(
        private authService: AuthService,
        private authDefaultService: AuthDefaultService,
        private router: Router,
        private actRoute: ActivatedRoute,
        private fb: FormBuilder,
    ) {}

    ngOnInit(): void {
        // Initialize form controls with validation
        const controls: any = {
            name: [
                '',
                [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(20),
                ],
            ],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        };

        // Check for client_id in URL query params
        this.clientId = this.actRoute.snapshot.queryParamMap.get('client_id')!;
        if (this.clientId) {
            this.isSignUp = true;
            // For a normal sign-up flow, we skip directly to step 2 (one-step)
            // so that name/email/password are shown right away
            this.currentStep = 2;
        } else {
            // Also require company fields if not sign-up
            controls['orgName'] = ['', [Validators.required]];
            controls['domain'] = ['', [Validators.required]];
        }

        this.registerForm = this.fb.group(controls);
    }

    // Move to step 2 if valid; only used when !isSignUp
    onNextClick(): void {
        const {orgName, domain} = this.registerForm.value;
        if (
            !orgName ||
            !domain ||
            this.registerForm.get('orgName')!.invalid ||
            this.registerForm.get('domain')!.invalid
        ) {
            return; // remain on step 1 if invalid
        }
        this.currentStep = 2;
    }

    async onSubmit(): Promise<void> {
        // If at step 1 and isSignUp is false, do nothing but move to step 2
        if (!this.isSignUp && this.currentStep === 1) {
            this.onNextClick();
            return;
        }

        // Abort if entire form is invalid (step 2 fields are part of the same form)
        if (this.registerForm.invalid) {
            return;
        }

        // Extract form values
        const {name, email, password, orgName, domain} =
            this.registerForm.value;
        this.isSignUpFailed = false;

        try {
            // If we have a clientId, treat it as sign up
            if (this.isSignUp) {
                await this.authService.signUp(
                    name,
                    email,
                    password,
                    this.clientId!,
                );
            } else {
                await this.authService.registerTenant(
                    name,
                    email,
                    password,
                    orgName,
                    domain,
                );
            }

            // Sign out or redirect after successful registration
            await this.authDefaultService.signOut('/home');
            this.isSuccessful = false;
        } catch (e: any) {
            console.error(e);
            this.isSignUpFailed = true;
            this.errorMessage = e.error.message;
        }
    }

    async onLoginClick(): Promise<void> {
        await this.authDefaultService.signOut('/home');
    }
}
