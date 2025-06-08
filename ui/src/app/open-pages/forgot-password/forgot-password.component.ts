import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
const API_URL = '/api/oauth';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss'],
    providers: [MessageService]
})
export class ForgotPasswordComponent implements OnInit {
    forgotPasswordForm: FormGroup;
    loading = false;
    isEmailSent = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private messageService: MessageService
    ) {
        this.forgotPasswordForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit(): void {}

    async onSubmit() {
        if (this.forgotPasswordForm.invalid) return;

        this.loading = true;
        this.errorMessage = '';

        try {
            const response = await this.http.post(
                `${API_URL}/forgot-password`,
                this.forgotPasswordForm.value
            ).toPromise();

            this.isEmailSent = true;
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Password reset instructions have been sent to your email'
            });
        } catch (error: any) {
            this.errorMessage = error.error?.message || 'Failed to send reset email';
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
