import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {lastValueFrom} from "rxjs";
import {TenantService} from "../../_services/tenant.service";
import {MessageService} from "primeng/api";

@Component({
    selector: 'app-create-tenant',
    template: `
        <div class="modal-header d-flex justify-content-between bg-primary-subtle">
            <h4 class="modal-title" id="modal-basic-title">Create Tenant</h4>
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
            <form #createTenantForm="ngForm"
                  (ngSubmit)="createTenantForm.form.valid && onSubmit()"
                  name="createTenantForm"
                  novalidate>
                <div class="mb-3 form-group">
                    <label class="form-label" for="create.tenant.name">Name</label>
                    <input #name="ngModel"
                           [(ngModel)]="form.name"
                           class="form-control"
                           id="create.tenant.name"
                           name="name"
                           required type="text">
                    <div
                        *ngIf="name.errors && createTenantForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Name is required!
                    </div>
                </div>
                <div class="mb-3 form-group">
                    <label class="form-label" for="create.tenant.domain">Domain</label>
                    <input #domain="ngModel"
                           [(ngModel)]="form.domain"
                           aria-describedby="emailHelp"
                           class="form-control"
                           id="create.tenant.domain"
                           name="domain"
                           required type="text">
                    <div
                        *ngIf="domain.errors && createTenantForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Domain is required!
                    </div>
                </div>
                <button class="btn btn-primary" type="submit">Create</button>
            </form>
        </div>
    `,
    styles: ['']
})
export class CreateTenantComponent implements OnInit {
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form = {
        name: "",
        domain: ""
    }

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    async onSubmit() {
        try {
            const createdTenant = await lastValueFrom(this.tenantService.createTenant(this.form.name, this.form.domain));
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Created'});
            this.passEntry.emit(createdTenant);
            this.activeModal.close(createdTenant);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Creation Failed'});
        }
    }
}
