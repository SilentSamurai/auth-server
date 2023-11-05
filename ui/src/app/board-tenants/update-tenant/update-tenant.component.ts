import {Component, OnInit} from '@angular/core';
import {firstValueFrom} from "rxjs";
import {MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
    selector: 'app-update-tenant',
    templateUrl: './update-tenant.component.html',
    styleUrls: ['./update-tenant.component.css']
})
export class UpdateTenantComponent implements OnInit {

    tenant: any;

    form = {
        name: "",
        domain: ""
    }

    constructor(private tenantService: TenantService,
                public ref: DynamicDialogRef,
                public config: DynamicDialogConfig,
                private messageService: MessageService) {
    }

    ngOnInit(): void {
        this.tenant = this.config.data.tenant;
        this.form = {
            name: this.tenant.name,
            domain: this.tenant.domain
        }
    }

    async onSubmit() {
        try {
            let editedTenant = await firstValueFrom(this.tenantService.editTenant(
                this.tenant.id,
                this.tenant.name === this.form.name ? null : this.form.name,
                this.tenant.domain === this.form.domain ? null : this.form.domain
            ));
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Updated'});
            this.ref.close(editedTenant);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Update Failed'});
        }
    }
}
