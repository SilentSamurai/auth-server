import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'delete-tenant-modal',
    template: `
        <app-standard-dialog title="Delete Tenant">
            <app-dialog-tab>
                <p>Are you sure, you want to delete tenant "<b>{{ tenant.domain }}</b>" ?</p>
            </app-dialog-tab>
            <app-dialog-footer>
                <button (click)="activeModal.close('Cross click')" class="btn btn-secondary" type="button">No
                </button>
                <button (click)="onYes()" class="btn btn-primary" type="button">Yes</button>
            </app-dialog-footer>
        </app-standard-dialog>
    `,
    styles: ['']
})
export class DeleteTenantComponent implements OnInit {
    @Input() tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.tenant);
    }

    async onYes() {
        try {
            let deletedTenant = await this.tenantService.deleteTenant(this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Deleted'});
            this.passEntry.emit(deletedTenant);
            this.activeModal.close(deletedTenant);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Deletion Failed'});
        }

    }
}
