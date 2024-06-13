import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {lastValueFrom} from "rxjs";
import {MessageService} from "primeng/api";
import {GroupService} from "../../_services/group.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {TenantService} from "../../_services/tenant.service";

@Component({
    selector: 'app-create-group',
    template: `
        <div class="modal-header d-flex justify-content-between bg-primary-subtle">
            <h4 class="modal-title">Create Group</h4>
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
            <form #createGroupForm="ngForm"
                  (ngSubmit)="createGroupForm.form.valid && onSubmit()"
                  name="createGroupForm"
                  novalidate>
                <div class="mb-3 form-group">
                    <label class="form-label" for="create.group.name">Name</label>
                    <input #name="ngModel"
                           [(ngModel)]="form.name"
                           class="form-control"
                           id="create.group.name"
                           name="name"
                           required type="text">
                    <div
                        *ngIf="name.errors && createGroupForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Name is required!
                    </div>
                </div>
                <div class="mb-3 form-group">
                    <label class="form-label" for="create.group.domain">Tenant</label>
                    <app-value-help-input
                        (dataProvider)="onTenantLoad($event)"
                        [(selection)]="form.tenantId"
                        class=""
                        id="create.group.tenantId"
                        idField="id"
                        labelField="name"
                        name="tenantId">

                        <app-fb-col name="name" label="Name"></app-fb-col>
                        <app-fb-col name="domain" label="Domain"></app-fb-col>

                        <app-vh-col name="name" label="Name"></app-vh-col>
                        <app-vh-col name="domain" label="Domain"></app-vh-col>


                        <ng-template #vh_body let-row>
                            <td>{{ row.name }}</td>
                            <td>
                                {{ row.domain }}
                            </td>
                        </ng-template>

                    </app-value-help-input>
                </div>
                <button class="btn btn-primary" type="submit">Create</button>
            </form>
        </div>
    `,
    styles: ['']
})
export class CreateGroupComponent implements OnInit {
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form = {
        name: "",
        tenantId: [] as any[]
    }
    private tenants: any[] = [];

    constructor(private groupService: GroupService,
                private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    async onSubmit() {
        try {
            const createdGroup = await this.groupService.createGroup(this.form.name, this.form.tenantId[0].id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Group Created'});
            this.passEntry.emit(createdGroup);
            this.activeModal.close(createdGroup);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Group Creation Failed'});
        }
    }

    async onTenantLoad(event: TableAsyncLoadEvent) {
        if (event.pageNo == 0) {
            this.tenants = await lastValueFrom(this.tenantService.getAllTenants());
            event.update(this.tenants);
        }
    }
}
