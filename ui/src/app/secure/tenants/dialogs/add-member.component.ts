import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'app-add-member',
    template: `
        <div class="modal-header d-flex justify-content-between">
            <h4 class="modal-title">Add Member</h4>
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
            <form #addMemberForm="ngForm"
                  (ngSubmit)="addMemberForm.form.valid && onSubmit()"
                  name="addMemberForm"
                  novalidate>
                <div class="mb-3 form-group">
                    <label class="form-label" for="add.member.name">Email</label>
                    <input #email="ngModel"
                           [(ngModel)]="form.email"
                           class="form-control"
                           id="add.member.name"
                           name="email"
                           required type="email">
                    <div
                        *ngIf="email.errors && addMemberForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Email is required!
                    </div>
                </div>
                <button class="btn btn-primary" type="submit">Add Member</button>
            </form>
        </div>
    `,
    styles: ['']
})
export class AddMemberComponent implements OnInit {

    @Input() readonly tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form = {
        email: ""
    }

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    async onSubmit() {
        try {
            const addedMember = await this.tenantService.addMember(this.form.email, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Member Added'});
            this.passEntry.emit(addedMember);
            this.activeModal.close(addedMember);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to add member'});
        }
    }
}
