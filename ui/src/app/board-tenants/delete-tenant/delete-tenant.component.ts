import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";

@Component({
    selector: 'delete-tenant-modal',
    templateUrl: './delete-tenant.component.html',
    styleUrls: ['./delete-tenant.component.css']
})
export class DeleteTenantComponent implements OnInit {
    @Input() tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(private tenantService: TenantService,
                private messageService: MessageService) {
    }

    ngOnInit() {
        console.log(this.tenant);
    }

    async onYes() {
        try {
            let deletedTenant = await this.tenantService.deleteTenant(this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Deleted'});
            this.passEntry.emit(deletedTenant);
            // this.activeModal.close(deletedTenant);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Deletion Failed'});
        }

    }
}
