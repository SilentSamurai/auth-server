import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'delete-tenant-modal',
    template: `
        <app-standard-dialog title="Delete Role">
            <app-dialog-tab>
                <p>Sure, you want to remove this role "<b>{{ role.name }}</b>" ?</p>
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
