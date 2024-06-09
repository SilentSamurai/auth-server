import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'app-create-tenant',
    template: `
        <div class="modal-header d-flex justify-content-between">
            <h4 class="modal-title">Add Role</h4>
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
            <form #addRoleForm="ngForm"
                  (ngSubmit)="addRoleForm.form.valid && onSubmit()"
                  name="addRoleForm"
                  novalidate>
                <div class="mb-3">
                    <label class="form-label" for="add.role.name">Role Name</label>
                    <input #name="ngModel"
                           [(ngModel)]="form.name"
                           class="form-control"
                           id="add.role.name"
                           name="name"
                           required type="text">

                    <div
                        *ngIf="name.errors && addRoleForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Role Name is required!
                    </div>
                </div>


                <button class="btn btn-primary" type="submit">Add Role</button>
            </form>
        </div>
    `,
    styles: ['']
})
export class AddRoleComponent implements OnInit {

    @Input() readonly tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form = {
        name: ""
    }

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    async onSubmit() {
        try {
            const addedRoles = await this.tenantService.addRole(this.form.name, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Role Added'});
            this.passEntry.emit(addedRoles);
            this.activeModal.close(addedRoles);
        } catch (e) {
            console.error(e)
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to add role'});
        }
    }
}
