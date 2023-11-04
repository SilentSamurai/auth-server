import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TenantService} from "../../../_services/tenant.service";
import {MessageService} from "primeng/api";

@Component({
    selector: 'app-add-member',
    templateUrl: './add-member.component.html',
    styleUrls: ['./add-member.component.css']
})
export class AddMemberComponent implements OnInit {

    @Input() readonly tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form = {
        email: ""
    }

    constructor(private tenantService: TenantService,
                private messageService: MessageService) {
    }

    ngOnInit(): void {
    }

    async onSubmit() {
        try {
            const addedMember = await this.tenantService.addMember(this.form.email, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Member Added'});
            this.passEntry.emit(addedMember);
            // this.activeModal.close(addedMember);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to add member'});
        }
    }
}
