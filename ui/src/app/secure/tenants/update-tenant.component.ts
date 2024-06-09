import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {lastValueFrom} from "rxjs";
import {MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";

@Component({
    selector: 'app-update-tenant',
    template: `
        <div class="modal-header d-flex justify-content-between">
            <h4 class="modal-title">Update Tenant</h4>
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
            <form #updateTenantForm="ngForm"
                  (ngSubmit)="updateTenantForm.form.valid && onSubmit()"
                  name="updateTenantForm"
                  novalidate>
                <div class="mb-3 form-group">
                    <label class="form-label" for="update.tenant.name">Name</label>
                    <input #name="ngModel"
                           [(ngModel)]="form.name"
                           class="form-control"
                           id="update.tenant.name"
                           name="name"
                           required type="text">
                    <div
                        *ngIf="name.errors && updateTenantForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Name is required!
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label" for="update.tenant.domain">Domain</label>
                    <input #domain="ngModel"
                           [(ngModel)]="form.domain"
                           aria-describedby="emailHelp"
                           class="form-control"
                           id="update.tenant.domain"
                           name="domain"
                           required type="text">
                    <div
                        *ngIf="domain.errors && updateTenantForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Domain is required!
                    </div>
                </div>
                <button class="btn btn-primary" type="submit">Update</button>
            </form>
        </div>
    `,
    styles: [
        ``
    ]
})
export class UpdateTenantComponent implements OnInit {
    @Input() tenant: any;
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
        this.form = {
            name: this.tenant.name,
            domain: this.tenant.domain
        }
    }

    async onSubmit() {
        try {
            let editedTenant = await lastValueFrom(this.tenantService.editTenant(
                this.tenant.id,
                this.tenant.name === this.form.name ? null : this.form.name,
                this.tenant.domain === this.form.domain ? null : this.form.domain
            ));
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Updated'});
            this.passEntry.emit(editedTenant);
            this.activeModal.close(editedTenant);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Update Failed'});
        }
    }
}
