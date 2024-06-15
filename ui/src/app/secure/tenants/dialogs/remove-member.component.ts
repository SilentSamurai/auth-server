import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'delete-tenant-modal',
    template: `
        <div class="modal-header">
            <h4 class="modal-title" id="modal-basic-title">Remove Member</h4>
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
            <p>Sure, you want to remove member "<b>{{ member.email }}</b>" ?</p>
            <div>
                <button (click)="activeModal.close('Cross click')" class="btn btn-secondary btn-md" type="button">No
                </button>
                <button (click)="onYes()" class="btn btn-primary btn-md m-2" type="button">Yes</button>
            </div>
        </div>
    `,
    styles: ['']
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
