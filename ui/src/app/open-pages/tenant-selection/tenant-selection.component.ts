import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../_services/auth.service';
import {SessionService} from '../../_services/session.service';
import {MessageService} from 'primeng/api';
import {lastValueFrom} from 'rxjs';

@Component({
    selector: 'app-tenant-selection',
    template: `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="mb-0">Select Tenant</h4>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-4">
                                You have access to this application through multiple tenants. Please select which tenant you want to use:
                            </p>
                            <div class="list-group">
                                <button *ngFor="let tenant of tenants"
                                        (click)="selectTenant(tenant)"
                                        class="list-group-item list-group-item-action">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 class="mb-1">{{tenant.name}}</h5>
                                            <small class="text-muted">{{tenant.domain}}</small>
                                        </div>
                                        <i class="fa fa-chevron-right"></i>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .list-group-item {
            cursor: pointer;
            transition: all 0.2s;
        }
        .list-group-item:hover {
            background-color: #f8f9fa;
        }
    `]
})
export class TenantSelectionComponent implements OnInit {
    tenants: any[] = [];
    private authCode: string = '';
    private clientId: string = '';
    private redirectUri: string = '';
    private state: string = '';

    constructor(
        private router: Router,
        private authService: AuthService,
        private tokenStorage: SessionService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        // Get the auth code and client ID from the URL or state
        const state = history.state;
        if (state?.authCode && state?.clientId && state?.tenants && state?.redirectUri) {
            this.authCode = state.authCode;
            this.clientId = state.clientId;
            this.tenants = state.tenants;
            this.redirectUri = state.redirectUri;
            this.state = state.state || '';
        } else {
            this.router.navigate(['/login']);
        }
    }

    async selectTenant(tenant: any) {
        try {
            // Update the subscriber tenant hint
            await this.authService.updateSubscriberTenantHint(
                this.authCode,
                this.clientId,
                tenant.domain || tenant.clientId
            );

            // Redirect back to the client application with the auth code and subscriber_tenant_hint
            const redirectUrl = new URL(this.redirectUri);
            redirectUrl.searchParams.append('code', this.authCode);
            redirectUrl.searchParams.append('subscriber_tenant_hint', tenant.domain || tenant.clientId);
            if (this.state) {
                redirectUrl.searchParams.append('state', this.state);
            }
            window.location.href = redirectUrl.toString();
        } catch (error) {
            console.error('Error during tenant selection:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to complete authentication. Please try again.',
                life: 5000
            });
        }
    }
} 