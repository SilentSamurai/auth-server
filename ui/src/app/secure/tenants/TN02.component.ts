import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
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
import {DeleteTenantComponent} from "./dialogs/delete-tenant.component";

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
                <button (click)="onUpdateTenant()" [disabled]="!isTenantAdmin"
                        class="btn btn-primary btn-sm">
                    Update
                </button>
                <button (click)="onDeleteTenant()" [disabled]="!isTenantAdmin"
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
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template let-columns="columns" let-role pTemplate="body">
                        <tr>
                            <td>
                                <a [routerLink]="['/RL02', tenant.id, role.name]"
                                   href="javascript:void(0)">{{ role.name }}
                                </a>
                            </td>
                            <td>

                            </td>
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
                private router: Router,
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

        this.authDefaultService.setTitle("TN02: " + this.tenant.name);
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

    async onDeleteTenant() {
        const modalRef = this.modalService.open(DeleteTenantComponent);
        modalRef.componentInstance.tenant = this.tenant;
        const deletedTenant = await modalRef.result;
        console.log(deletedTenant);
        await this.router.navigate(['/home']);
    }
}
