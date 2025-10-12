import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthDefaultService} from '../../_services/auth.default.service';
import {AuthService} from '../../_services/auth.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MessageService} from 'primeng/api';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    providers: [MessageService]
})
export class RegisterComponent implements OnInit {
    // Reactive form
    registerForm!: FormGroup;

    // Additional states
    isSuccessful = false;
    isSignUpFailed = false;
    errorMessage = '';
    loading = false;

    // For multi-step flow
    currentStep = 1;

    constructor(
        private authService: AuthService,
        private authDefaultService: AuthDefaultService,
        private router: Router,
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
    }

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
            orgName: ['', [Validators.required]],
            domain: ['', [Validators.required]],
        };

        this.registerForm = this.fb.group(controls);
    }

    onNextClick(): void {
        const {orgName, domain} = this.registerForm.value;
        if (
            !orgName ||
            !domain ||
            this.registerForm.get('orgName')!.invalid ||
            this.registerForm.get('domain')!.invalid
        ) {
            this.registerForm.get('orgName')!.markAsTouched();
            this.registerForm.get('domain')!.markAsTouched();
            return; // remain on step 1 if invalid
        }
        this.currentStep = 2;
    }

    async onSubmit(): Promise<void> {
        // If at step 1, move to step 2 first
        if (this.currentStep === 1) {
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
            await this.authService.registerTenant(
                name,
                email,
                password,
                orgName,
                domain,
            );

            // Show success toast
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Registration successful! Please check your email for verification.'
            });

            // Sign out or redirect after successful registration
            await this.authDefaultService.signOut('/home');
            this.isSuccessful = false;
        } catch (e: any) {
            console.error(e);
            this.isSignUpFailed = true;
            this.errorMessage = e.error.message;
            
            // Show error toast
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: e.error.message || 'Registration failed. Please try again.'
            });
        }
    }

    async onLoginClick(): Promise<void> {
        await this.authDefaultService.signOut('/home');
    }
}
