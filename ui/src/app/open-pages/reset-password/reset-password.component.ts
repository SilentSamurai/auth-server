import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

const API_URL = '/api/oauth';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss'],
    providers: [MessageService]
})
export class ResetPasswordComponent implements OnInit {
    resetPasswordForm: FormGroup;
    loading = false;
    isPasswordReset = false;
    errorMessage = '';
    token: string = '';
    isPasswordVisible = false;
    isConfirmPasswordVisible = false;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.resetPasswordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validator: this.passwordMatchValidator
        });
    }

    ngOnInit(): void {
        this.token = this.route.snapshot.params['token'];
        if (!this.token) {
            this.router.navigate(['/login']);
        }
    }

    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password?.value !== confirmPassword?.value) {
            confirmPassword?.setErrors({ passwordMismatch: true });
        } else {
            confirmPassword?.setErrors(null);
        }
    }

    async onSubmit() {
        if (this.resetPasswordForm.invalid) return;

        this.loading = true;
        this.errorMessage = '';

        try {
            const response = await this.http.post(
                `${API_URL}/reset-password/${this.token}`,
                { password: this.resetPasswordForm.value.password }
            ).toPromise();

            this.isPasswordReset = true;
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Your password has been reset successfully'
            });

            // Redirect to login after 3 seconds
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 3000);
        } catch (error: any) {
            this.errorMessage = error.error?.message || 'Failed to reset password';
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: this.errorMessage
            });
        } finally {
            this.loading = false;
        }
    }
}
