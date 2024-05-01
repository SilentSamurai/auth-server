import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'app-tenant-assign-scope',
    templateUrl: './assign-scope.component.html',
    styleUrls: ['./assign-scope.component.css']
})
export class AssignScopeComponent implements OnInit {

    @Input() readonly tenant: any;
    @Input() readonly user: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    selectedScopes = [];
    scopes = []

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
        this.scopes = this.tenant.scopes;
        this.selectedScopes = this.user.scopes;
        console.log(this.tenant, this.user);
    }

    async onSubmit() {
        console.log(this.selectedScopes);
        try {
            const assignedScope = await this.tenantService.assignScope(this.selectedScopes, this.tenant.id, this.user.email);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Scope Assigned'});
            this.passEntry.emit(assignedScope);
            this.activeModal.close(assignedScope);
        } catch (e) {
            console.error(e)
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to assign scope'});
        }
    }
}
