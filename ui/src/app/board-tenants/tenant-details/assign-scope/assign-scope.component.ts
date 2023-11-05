import {Component, OnInit} from '@angular/core';
import {TenantService} from "../../../_services/tenant.service";
import {MessageService} from "primeng/api";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
    selector: 'app-tenant-assign-scope',
    templateUrl: './assign-scope.component.html',
    styleUrls: ['./assign-scope.component.css']
})
export class AssignScopeComponent implements OnInit {

    tenant: any;
    user: any;

    selectedScopes = [];
    scopes = []

    constructor(private tenantService: TenantService,
                public ref: DynamicDialogRef,
                public config: DynamicDialogConfig,
                private messageService: MessageService) {
    }

    ngOnInit(): void {
        this.tenant = this.config.data.tenant;
        this.user = this.config.data.user;
        this.scopes = this.tenant.scopes;
        this.selectedScopes = this.user.scopes;
        console.log(this.tenant, this.user);
    }

    async onSubmit() {
        console.log(this.selectedScopes);
        try {
            const assignedScope = await this.tenantService.assignScope(this.selectedScopes, this.tenant.id, this.user.email);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Scope Assigned'});
            // this.passEntry.emit(assignedScope);
            // this.activeModal.close(assignedScope);
            this.ref.close(assignedScope);
        } catch (e) {
            console.error(e)
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to assign scope'});
        }
    }
}
