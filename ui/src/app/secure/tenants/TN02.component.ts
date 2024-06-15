import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {UpdateTenantComponent} from "./dialogs/update-tenant.component";
import {AddMemberComponent} from "./dialogs/add-member.component";
import {AddRoleComponent} from "./dialogs/add-role.component";
import {RemoveRoleComponent} from "./dialogs/remove-role.component";
import {RemoveMemberComponent} from "./dialogs/remove-member.component";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'view-tenant',
    template: `
        <nav-bar></nav-bar>
        <app-object-page>
            <app-object-page-header>
                <div class="row">
                    <div class="col-lg-5">
                        <div class=" my-2 mb-4">
                            <div class="p-disabled">Tenant Domain</div>
                            <h4>{{ tenant.domain }}</h4>
                        </div>
                        <div class="my-2">
                            <div class="p-disabled">Tenant Id</div>
                            <div>{{ tenant_id }}</div>
                        </div>
                        <div class="my-2">
                            <div class="p-disabled">Tenant Name</div>
                            <div>{{ tenant.name }}</div>
                        </div>
                        <div class="d-flex justify-content-between total font-weight-bold mt-4">
                            <button (click)="onUpdateTenant()" [disabled]="!isTenantAdmin"
                                    class="btn btn-primary btn-sm">
                                Update
                            </button>
                        </div>
                    </div>
                    <div class="col-lg-7">
                        <div class="my-2">
                            <div class="p-disabled">Client Id</div>
                            <div>
                                <code>
                                    <pre class="text-wrap text-break">{{ credentials.clientId }}</pre>
                                </code>
                            </div>
                        </div>
                        <div class="my-2">
                            <div class="p-disabled">Client Secret</div>
                            <div>
                                <code>
                                    <pre class="text-wrap text-break">{{ credentials.clientSecret }}</pre>
                                </code>
                            </div>
                        </div>
                        <div class="my-2">
                            <div class="p-disabled">Public Key</div>
                            <div>
                                <code>
                                    <pre class="text-wrap text-break">{{ credentials.publicKey }}</pre>
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </app-object-page-header>
            <app-object-page-section name="Members">
                <p-table [value]="members" responsiveLayout="scroll">
                    <ng-template pTemplate="caption">
                        <div class="d-flex justify-content-between">
                            <h5>Member List</h5>
                            <button (click)="onAddMember()" [disabled]="!isTenantAdmin"
                                    class="btn btn-primary btn-sm">
                                Add Member
                            </button>
                        </div>

                    </ng-template>
                    <ng-template let-columns pTemplate="header">
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Assigned Roles</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template let-columns="columns" let-user pTemplate="body">
                        <tr>
                            <td><span class="p-column-title">Name</span>{{ user.name }}</td>
                            <td><span class="p-column-title">Email</span>{{ user.email }}</td>
                            <td><span class="p-column-title">Roles</span>
                                <a [routerLink]="['/TNRL01/', tenant_id, user.email]"
                                   href="javascript:void(0)">View Role Assignments
                                </a>
                            </td>
                            <td class="">
                                <button (click)="removeMember(user)" [disabled]="!isTenantAdmin" class="btn"
                                        type="button">
                                    <i class="fa fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </app-object-page-section>

            <app-object-page-section name="Roles">
                <p-table [value]="tenant.roles" responsiveLayout="scroll">
                    <ng-template pTemplate="caption">
                        <div class="d-flex justify-content-between">
                            <h5>Role List</h5>
                            <button (click)="onAddRole()" [disabled]="!isTenantAdmin"
                                    class="btn btn-primary btn-sm">
                                Create Role
                            </button>
                        </div>

                    </ng-template>
                    <ng-template let-columns pTemplate="header">
                        <tr>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template let-columns="columns" let-role pTemplate="body">
                        <tr>
                            <td><span class="p-column-title">Name</span>{{ role.name }}</td>
                            <td>
                                <button (click)="onRemoveRole(role)"
                                        *ngIf="role.removable"
                                        [disabled]="!isTenantAdmin"
                                        class="btn btn-sm"
                                        type="button">
                                    <i class="fa fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </app-object-page-section>
        </app-object-page>
    `,
    styles: ['']
})
export class TN02Component implements OnInit {

    tenant_id: string = "";
    tenant: any = {};
    credentials: any = {
        clientId: "NA",
        clientSecret: "NA",
        publicKey: "NA"
    };
    members: any = []
    isTenantAdmin = false;

    constructor(private tenantService: TenantService,
                private tokenStorageService: TokenStorageService,
                private messageService: MessageService,
                private actRoute: ActivatedRoute,
                private authDefaultService: AuthDefaultService,
                private modalService: NgbModal) {
    }

    async ngOnInit() {

        this.tenant_id = this.actRoute.snapshot.params['tenantId'];
        if (this.tokenStorageService.isTenantAdmin()) {
            this.isTenantAdmin = true;
            this.credentials = await this.tenantService.getTenantCredentials(this.tenant_id);
        }
        console.log(this.tenant_id);
        this.tenant = await this.tenantService.getTenantDetails(this.tenant_id);
        this.members = await this.tenantService.getMembers(this.tenant_id);

        this.authDefaultService.setTitle("Tenant: " + this.tenant.name);
    }

    async onUpdateTenant() {
        const modalRef = this.modalService.open(UpdateTenantComponent);
        modalRef.componentInstance.tenant = this.tenant;
        const editedTenant = await modalRef.result;
        console.log(editedTenant);
        await this.ngOnInit();
    }

    async onAddMember() {
        const modalRef = this.modalService.open(AddMemberComponent);
        modalRef.componentInstance.tenant = this.tenant;
        const addedMember = await modalRef.result;
        console.log(addedMember);
        await this.ngOnInit();
    }

    async onAddRole() {
        const modalRef = this.modalService.open(AddRoleComponent);
        modalRef.componentInstance.tenant = this.tenant;
        const addedRole = await modalRef.result;
        console.log(addedRole);
        await this.ngOnInit();
    }

    async onRemoveRole(role: any) {
        const modalRef = this.modalService.open(RemoveRoleComponent);
        modalRef.componentInstance.role = role;
        modalRef.componentInstance.tenant = this.tenant;
        const deletedRole = await modalRef.result;
        console.log(deletedRole);
        await this.ngOnInit();
    }

    async removeMember(user: any) {
        const modalRef = this.modalService.open(RemoveMemberComponent);
        modalRef.componentInstance.tenant = this.tenant;
        modalRef.componentInstance.member = user;
        const removedMember = await modalRef.result;
        console.log(removedMember);
        await this.ngOnInit();
    }

}
