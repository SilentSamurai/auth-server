import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {UpdateTenantComponent} from "./dialogs/update-tenant.component";
import {AddMemberComponent} from "./dialogs/add-member.component";
import {AddRoleComponent} from "./dialogs/add-role.component";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {ConfirmationService} from "../../component/dialogs/confirmation.service";
import {Location} from '@angular/common';
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";

@Component({
    selector: 'view-tenant',
    template: `
        <nav-bar></nav-bar>
        <app-object-page>
            <app-object-page-title>
                {{ tenant.name }}
            </app-object-page-title>
            <app-object-page-subtitle>
                {{ tenant.domain }}
            </app-object-page-subtitle>
            <app-object-page-actions>
                <button (click)="onUpdateTenant()" [disabled]="!isTenantAdmin" id="UPDATE_TENANT_BTN"
                        class="btn btn-primary btn-sm">
                    Update
                </button>
                <button (click)="onDeleteTenant()" [disabled]="!isTenantAdmin" id="DELETE_TENANT_BTN"
                        class="btn btn-danger btn-sm ms-2 ">
                    Delete Tenant
                </button>
            </app-object-page-actions>
            <app-object-page-header>
                <div class="row">
                    <div class="col-lg-5">
                        <app-attribute label="Tenant Domain">
                            {{ tenant.domain }}
                        </app-attribute>
                        <app-attribute label="Tenant Id">
                            {{ tenant_id }}
                        </app-attribute>
                        <app-attribute label="Tenant Name">
                            {{ tenant.name }}
                        </app-attribute>
                    </div>
                    <div class="col-lg-7">
                        <app-attribute label="Client Id">
                            <code>
                                <pre class="text-wrap text-break">{{ credentials.clientId }}</pre>
                            </code>
                        </app-attribute>
                        <app-attribute label="Client Secret">
                            <code>
                                <pre class="text-wrap text-break">{{ credentials.clientSecret }}</pre>
                            </code>
                        </app-attribute>
                        <app-attribute label="Public Key">
                            <code>
                                <pre class="text-wrap text-break">{{ credentials.publicKey }}</pre>
                            </code>
                        </app-attribute>
                    </div>
                </div>
            </app-object-page-header>
            <app-object-page-section name="Members">
                <app-table
                    title="Member List"
                    (onDataRequest)="onMemberDataLoad($event)">

                    <app-table-col label="Name" name="name"></app-table-col>
                    <app-table-col label="Email" name="email"></app-table-col>
                    <app-table-col label="Assigned Roles" name="roles"></app-table-col>
                    <app-table-col label="Actions" name="actions"></app-table-col>

                    <app-table-btn>
                        <button (click)="onAddMember()" [disabled]="!isTenantAdmin"
                                id="OPEN_ADD_MEMBER_DIALOG_BTN"
                                class="btn btn-primary btn-sm">
                            Add
                        </button>
                    </app-table-btn>

                    <ng-template let-user #table_body>
                        <td>{{ user.name }}</td>
                        <td>{{ user.email }}</td>
                        <td>
                            <a [routerLink]="['/TNRL01/', tenant_id, user.id]"
                               href="javascript:void(0)">View Role Assignments
                            </a>
                        </td>
                        <td class="">
                            <button (click)="removeMember(user)" [disabled]="!isTenantAdmin"
                                    class="btn"
                                    [attr.data-cy-id]="user.email"
                                    type="button">
                                <i class="fa fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </ng-template>
                </app-table>
            </app-object-page-section>

            <app-object-page-section name="Roles">
                <app-table
                    title="Role List"
                    (onDataRequest)="onRoleDataLoad($event)"
                >

                    <app-table-col label="Name" name="name"></app-table-col>
                    <app-table-col label="Description" name="description"></app-table-col>
                    <app-table-col label="Actions" name="actions"></app-table-col>

                    <app-table-btn>
                        <button (click)="onAddRole()" [disabled]="!isTenantAdmin"
                                id="ADD_ROLE_DIALOG_BTN"
                                class="btn btn-primary btn-sm">
                            Create
                        </button>
                    </app-table-btn>

                    <ng-template let-role #table_body>
                        <td>
                            <a [routerLink]="['/RL02', tenant.id, role.name]"
                               href="javascript:void(0)">{{ role.name }}
                            </a>
                        </td>
                        <td>{{ role.description }}</td>
                        <td>
                            <button (click)="onRemoveRole(role)"
                                    *ngIf="role.removable"
                                    [disabled]="!isTenantAdmin"
                                    class="btn btn-sm"
                                    [attr.data-cy-id]="role.name"
                                    type="button">
                                <i class="fa fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </ng-template>

                </app-table>

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
    roles: any = [];

    constructor(private tenantService: TenantService,
                private tokenStorageService: TokenStorageService,
                private messageService: MessageService,
                private actRoute: ActivatedRoute,
                private router: Router,
                private _location: Location,
                private confirmationService: ConfirmationService,
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

        this.authDefaultService.setTitle("TN02: " + this.tenant.name);
    }

    async onMemberDataLoad(event: TableAsyncLoadEvent) {
        this.members = await this.tenantService.getMembers(this.tenant_id);
        event.update(this.members, false);
    }

    async onRoleDataLoad(event: TableAsyncLoadEvent) {
        this.roles = await this.tenantService.getTenantRoles(this.tenant_id);
        event.update(this.roles, false);
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
        const deletedRole = await this.confirmationService.confirm({
            message: `Sure, you want to remove this role "<b>${role.name}</b>" ?`,
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            accept: async () => {
                try {
                    let deletedRole = await this.tenantService.removeRole(role.name, this.tenant.id);
                    this.messageService.add({severity: 'success', summary: 'Success', detail: 'Role Deleted'});
                    return deletedRole;
                } catch (e) {
                    this.messageService.add({severity: 'error', summary: 'Error', detail: 'Role Deletion Failed'});
                }
                return null;
            }
        })
        console.log(deletedRole);
        await this.ngOnInit();
    }

    async removeMember(user: any) {
        const removedMember = await this.confirmationService.confirm({
            message: `Are you sure you want to remove <b> ${user.email} </b> ?`,
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            accept: async () => {
                try {
                    const removedMember = await this.tenantService.removeMember(user.email, this.tenant.id);
                    this.messageService.add({severity: 'success', summary: 'Success', detail: 'Member Removed'});
                    return removedMember;
                } catch (e) {
                    this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to remove member'});
                }
                return null;
            }
        })
        console.log(removedMember);
        await this.ngOnInit();
    }

    async onDeleteTenant() {
        const deletedTenant = await this.confirmationService.confirm({
            message: `Are you sure you want to delete <b> ${this.tenant.domain} </b> ?`,
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            accept: async () => {
                try {
                    let deletedTenant = await this.tenantService.deleteTenant(this.tenant.id);
                    this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Deleted'});
                    return deletedTenant;
                } catch (e) {
                    this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Deletion Failed'});
                }
                return null;
            }
        })
        console.log(deletedTenant);
        this._location.back();
    }
}
