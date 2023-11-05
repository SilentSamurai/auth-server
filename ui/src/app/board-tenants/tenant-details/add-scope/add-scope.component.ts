import {Component, OnInit} from '@angular/core';
import {TenantService} from "../../../_services/tenant.service";
import {MessageService} from "primeng/api";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
    selector: 'app-create-tenant',
    templateUrl: './add-scope.component.html',
    styleUrls: ['./add-scope.component.css']
})
export class AddScopeComponent implements OnInit {

    tenant: any;

    form = {
        name: ""
    }

    constructor(private tenantService: TenantService,
                public ref: DynamicDialogRef,
                public config: DynamicDialogConfig,
                private messageService: MessageService) {
    }

    ngOnInit(): void {
        this.tenant = this.config.data.tenant;
    }

    async onSubmit() {
        try {
            const addedScope = await this.tenantService.addScope(this.form.name, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Scope Added'});
            // this.passEntry.emit(addedScope);
            // this.activeModal.close(addedScope);
            this.ref.close(addedScope);
        } catch (e) {
            console.error(e)
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to add scope'});
        }
    }
}
