import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'delete-tenant-modal',
    template: `
        <div class="modal-header">
            <h4 class="modal-title" id="modal-basic-title">Delete Tenant</h4>
            <button (click)="activeModal.close('Cross click')"
                    aria-label="Close"
                    class="btn-sm btn "
                    type="button">
        <span aria-hidden="true">
            <i class="fa fa-icons fa-close"></i>
        </span>
            </button>
        </div>
        <div class="modal-body">
            <p>Are you sure, you want to delete tenant "<b>{{ tenant.domain }}</b>" ?</p>
            <div class="align-items-end">
                <button (click)="activeModal.close('Cross click')" class="btn btn-secondary btn-md" type="button">No
                </button>
                <button (click)="onYes()" class="btn btn-primary btn-md m-2" type="button">Yes</button>
            </div>
        </div>
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
