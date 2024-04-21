import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";

@Component({
    selector: 'delete-tenant-modal',
    templateUrl: './remove-member.component.html',
    styleUrls: ['./remove-member.component.css']
})
export class RemoveMemberComponent implements OnInit {
    @Input() member: any;
    @Input() tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.member);
    }

    async onYes() {
        try {
            const removedMember = await this.tenantService.removeMember(this.member.email, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Member Removed'});
            this.passEntry.emit(removedMember);
            this.activeModal.close(removedMember);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to remove member'});
        }
    }
}
