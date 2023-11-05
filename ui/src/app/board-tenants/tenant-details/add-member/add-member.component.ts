import {Component, OnInit} from '@angular/core';
import {TenantService} from "../../../_services/tenant.service";
import {MessageService} from "primeng/api";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
    selector: 'app-add-member',
    templateUrl: './add-member.component.html',
    styleUrls: ['./add-member.component.css']
})
export class AddMemberComponent implements OnInit {

    tenant: any;

    form = {
        email: ""
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
            const addedMember = await this.tenantService.addMember(this.form.email, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Member Added'});
            // this.activeModal.close(addedMember);
            this.ref.close(addedMember);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to add member'});
        }
    }
}
