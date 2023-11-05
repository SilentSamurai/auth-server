import {Component, OnInit} from '@angular/core';
import {lastValueFrom} from "rxjs";
import {TenantService} from "../../_services/tenant.service";
import {MessageService} from "primeng/api";
import {DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
    selector: 'app-create-tenant',
    templateUrl: './create-tenant.component.html',
    styleUrls: ['./create-tenant.component.scss']
})
export class CreateTenantComponent implements OnInit {
    // @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form = {
        name: "",
        domain: ""
    }

    constructor(private tenantService: TenantService,
                public ref: DynamicDialogRef,
                private messageService: MessageService) {
    }

    ngOnInit(): void {
    }

    async onSubmit() {
        try {
            const createdTenant = await lastValueFrom(this.tenantService.createTenant(this.form.name, this.form.domain));
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Created'});
            // this.passEntry.emit(createdTenant);
            // this.activeModal.close(createdTenant);
            this.ref.close(createdTenant);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Creation Failed'});
        }
    }
}
