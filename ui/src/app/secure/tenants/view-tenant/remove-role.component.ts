import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'delete-tenant-modal',
    template: `
        <div class="modal-header d-flex justify-content-between">
            <h4 class="modal-title">Remove Role</h4>
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
            <p>Sure, you want to remove this role "<b>{{ role.name }}</b>" ?</p>
            <div class="align-items-end">
                <button (click)="activeModal.close('Cross click')" class="btn btn-secondary btn-md" type="button">No
                </button>
                <button (click)="onYes()" class="btn btn-primary btn-md m-2" type="button">Yes</button>
            </div>
        </div>
    `,
    styles: ['']
})
export class RemoveRoleComponent implements OnInit {
    @Input() role: any;
    @Input() tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.role);
    }

    async onYes() {
        try {
            let deletedRole = await this.tenantService.removeRole(this.role.name, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Role Deleted'});
            this.passEntry.emit(deletedRole);
            this.activeModal.close(deletedRole);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Role Deletion Failed'});
        }

    }
}
