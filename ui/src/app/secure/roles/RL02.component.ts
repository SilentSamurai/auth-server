import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {RoleService} from "../../_services/role.service";
import {MessageService} from "primeng/api";
import {ConfirmationService} from "../../component/dialogs/confirmation.service";
import {StaticModel} from "../../component/model/StaticModel";
import {PolicyService} from "../../_services/policy.service";
import {CreatePolicyModalComponent} from "./create-policy-modal.component";
import {AddUsersModalComponent} from "./add-users-modal.component";

@Component({
    selector: 'app-group-object',
    template: `
        <nav-bar></nav-bar>
        <app-object-page *ngIf="!loading">
            <app-op-title>
                {{ role.name }}
            </app-op-title>
            <app-op-subtitle>
                {{ role.tenant.name }}
            </app-op-subtitle>
            <app-op-actions>
                <button (click)="onUpdateRole()"
                        class="btn btn-primary btn-sm me-2">
                    Update
                </button>

                <button (click)="onDeleteRole()"
                        class="btn btn-danger btn-sm">
                    Delete
                </button>
            </app-op-actions>
            <app-op-header>
                <div class="row">
                    <div class="col">
                        <app-attribute label="Name">
                            {{ role.name }}
                        </app-attribute>
                        <app-attribute label="Description">
                            {{ role.description }}
                        </app-attribute>
                    </div>
                    <div class="col">
                        <app-attribute label="Tenant Id">
                            {{ role.tenant.id }}
                        </app-attribute>
                        <app-attribute label="Tenant Name">
                            {{ role.tenant.name }}
                        </app-attribute>
                    </div>
                </div>
            </app-op-header>
            <app-op-tab name="Users">
                <app-op-section name="Users">
                    <app-section-action>
                    </app-section-action>
                    <app-section-content>
                        <p-table [value]="users" responsiveLayout="scroll">
                            <ng-template pTemplate="caption">
                                <div class="d-flex justify-content-between">
                                    <h5>Users </h5>
                                    <button (click)="openAddUsersModal()"
                                            class="btn btn-primary btn-sm">
                                        Assign Users
                                    </button>
                                </div>
                            </ng-template>
                            <ng-template let-columns pTemplate="header">
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </ng-template>
                            <ng-template let-columns="columns" let-user pTemplate="body">
                                <tr>
                                    <td>{{ user.name }}</td>
                                    <td>{{ user.email }}</td>
                                    <td>
                                        <button (click)="onUserRemove(user)"
                                                class="btn btn-sm"
                                                type="button">
                                            <i class="fa fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </app-section-content>
                </app-op-section>
            </app-op-tab>


            <app-op-tab name="Policies">
                <app-op-section name="Policies">
                    <app-section-content>
                        <p-table [value]="policies" responsiveLayout="scroll">
                            <ng-template pTemplate="caption">
                                <div class="d-flex justify-content-between">
                                    <h5>Policies</h5>
                                    <button class="btn btn-sm btn-primary" (click)="openCreatePolicyModal()">
                                        New Policy
                                    </button>
                                </div>
                            </ng-template>
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Effect</th>
                                    <th>Action</th>
                                    <th>Subject</th>
                                    <th>Conditions</th>
                                    <th>Actions</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-policy>
                                <tr>
                                    <td>{{ policy.effect }}</td>
                                    <td>{{ policy.action }}</td>
                                    <td>{{ policy.subject }}</td>
                                    <td>{{ isEmpty(policy.conditions) ? '' : '{...}' }}</td>
                                    <td>
                                        <button
                                            class="btn btn-sm btn-success me-2"
                                            (click)="openViewPolicyModal(policy.id)"
                                        >
                                            <i class="fa fa-eye"></i>
                                        </button>
                                        <button
                                            class="btn btn-sm btn-warning me-2"
                                            (click)="openUpdatePolicyModal(policy.id)"
                                        >
                                            <i class="fa fa-pencil"></i>
                                        </button>
                                        <button
                                            class="btn btn-sm btn-danger"
                                            (click)="onPolicyRemove(policy)"
                                        >
                                            <i class="fa fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </app-section-content>
                </app-op-section>
            </app-op-tab>
        </app-object-page>


        <div class="text-center mt-5" *ngIf="loading">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <p-confirmDialog></p-confirmDialog>


    `,
    styles: ['']
})
export class RL02Component implements OnInit {

    loading = true;
    role: any;
    users: any[] = [];
    policies: any[] = [];
    newPolicy = {
        action: '',
        subject: '',
        effect: 'ALLOW'
    };
    usersDM = new StaticModel(['id']);
    selectedUsers: any[] = [];
    private roleName: string = "";
    private tenantId: string = "";

    constructor(private tenantService: TenantService,
                private tokenStorageService: TokenStorageService,
                private messageService: MessageService,
                private roleService: RoleService,
                private actRoute: ActivatedRoute,
                private router: Router,
                private authDefaultService: AuthDefaultService,
                private confirmationService: ConfirmationService,
                private modalService: NgbModal,
                private policyService: PolicyService) {
    }

    async ngOnInit() {
        this.loading = true;

        if (!this.actRoute.snapshot.params.hasOwnProperty("roleName") || !this.actRoute.snapshot.params.hasOwnProperty("tenantId")) {
            await this.router.navigate(["/RL01"]);
        }

        this.roleName = this.actRoute.snapshot.params['roleName'];
        this.tenantId = this.actRoute.snapshot.params['tenantId'];

        let response = await this.roleService.getRoleDetails(this.tenantId, this.roleName);

        this.role = response.role;
        this.users = response.users;
        this.usersDM.setData(this.users);

        // Load policies for the given role
        try {
            this.policies = await this.policyService.getRoleAuthorizations(this.role.id);
        } catch (e: any) {
            console.error("Error fetching role authorizations:", e);
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Could not load policies'});
        }

        this.authDefaultService.setTitle("RL02: " + this.role.name);

        this.loading = false;
    }

    async onUpdateRole() {
        // const modalRef = this.modalService.open(UpdateGroupComponent);
        // modalRef.componentInstance.groupId = this.group_id;
        // const user = await modalRef.result;
        // console.log(user);
        this.ngOnInit();
    }

    async onDeleteRole() {
        await this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            accept: async () => {
                await this.roleService.deleteRole(this.role.tenantId, this.role.name);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'Group removed'});
                await this.router.navigate(["/RL01"]);
            }
        })
    }


    async onUserRemove(user: any) {
        await this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            accept: async () => {
                await this.roleService.removeUser(this.tenantId, this.roleName, [user.email]);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'User removed'});
            }
        });
        await this.ngOnInit();
    }

    async openAddUsersModal(): Promise<void> {
        const modalRef = this.modalService.open(AddUsersModalComponent, {
            size: 'lg',
            backdrop: 'static'
        });

        // Pass required context to modal
        modalRef.componentInstance.tenantId = this.tenantId;
        modalRef.componentInstance.roleName = this.roleName;
        modalRef.componentInstance.usersDM.setData(this.users);

        const result = await modalRef.result;
        if (result) { // Only refresh if modal was closed with success
            try {
                const response = await this.roleService.getRoleDetails(this.tenantId, this.roleName);
                this.users = response.users;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Updated',
                    detail: 'User list refreshed'
                });
            } catch (e) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Refresh Failed',
                    detail: 'Could not update user list'
                });
            }
        }
    }

    // async provideUsers($event: TableAsyncLoadEvent) {
    //     let members = await this.tenantService.getMembers(this.tenantId);
    //     $event.update(members, false);
    // }

    async openCreatePolicyModal(): Promise<void> {
        const modalRef = this.modalService.open(CreatePolicyModalComponent, {
            size: 'lg',  // optional, sets modal size (lg, sm, etc.)
            backdrop: 'static', // optional
            centered: true     // optional
        });
        modalRef.componentInstance.role_id = this.role.id;  // create mode

        const createdPolicy = await modalRef.result;
        if (createdPolicy) {
            await this.reloadPolicies();
        }
    }

    // New method for editing (update) an existing policy
    async openUpdatePolicyModal(policyId: string): Promise<void> {
        const modalRef = this.modalService.open(CreatePolicyModalComponent, {
            size: 'lg',  // optional, sets modal size (lg, sm, etc.)
            backdrop: 'static', // optional
            centered: true     // optional
        });
        modalRef.componentInstance.role_id = this.role.id;
        modalRef.componentInstance.policyId = policyId;  // update mode

        const updatedPolicy = await modalRef.result;
        if (updatedPolicy) {
            await this.reloadPolicies();
        }
    }

    // New method to remove a policy
    async onPolicyRemove(policy: any) {
        await this.confirmationService.confirm({
            message: `Are you sure you want to delete this policy?  [${policy.effect}] [${policy.action}] on [${policy.subject}].`,
            accept: async () => {
                try {
                    await this.policyService.deleteAuthorization(policy.id);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Policy Deleted',
                        detail: `Policy [${policy.id}] was removed.`
                    });
                    await this.reloadPolicies();
                } catch (err: any) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Failed to delete policy',
                        detail: err.message
                    });
                }
            }
        });
    }

    async reloadPolicies() {
        try {
            this.policies = await this.policyService.getRoleAuthorizations(this.role.id);
        } catch (e: any) {
            console.error("Error reloading policies:", e);
            this.messageService.add({severity: 'error', summary: 'Failed', detail: 'Could not reload policies'});
        }
    }

    async openViewPolicyModal(policyId: string): Promise<void> {
        const modalRef = this.modalService.open(CreatePolicyModalComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
        });
        modalRef.componentInstance.policyId = policyId;
        modalRef.componentInstance.viewOnly = true;

        // Because it’s purely read-only, we don’t expect a changed policy returned
        // but we can still wait for modalRef.result if needed
        await modalRef.result;
    }

    isEmpty(obj: any) {
        for (const prop in obj) {
            return false;
        }
        return true;
    }

}
