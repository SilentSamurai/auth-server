import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {RoleService} from "../../_services/role.service";
import {MessageService} from "primeng/api";
import {ConfirmationService} from "../../component/dialogs/confirmation.service";
import {StaticModel} from "../../component/model/StaticModel";
import {PolicyService} from "../../_services/policy.service";
import {CreatePolicyModalComponent} from "./create-policy-modal.component";
import {CloseType, ValueHelpResult} from "../../component/value-help/value-help.component";
import {UpdateRoleModalComponent} from "./update-role-modal.component";
import { ModalService, ModalResult } from "../../component/dialogs/modal.service"; // an example path

@Component({
    selector: 'app-RL02',
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
                                    <app-value-help-button
                                        classStyle="btn-sm btn-primary"
                                        [dataModel]="usersDM"
                                        [multi]="true"
                                        [selection]="users"
                                        name="Select Users"
                                        (onOpen)="onUserVhOpen()"
                                        (onClose)="onUserVhClose($event)">

                                        <app-btn-content>
                                            Assign Users
                                        </app-btn-content>
                                        <app-vh-col label="Email" name="email"></app-vh-col>

                                        <ng-template #vh_body let-row>
                                            <td>{{ row.email }}</td>
                                        </ng-template>

                                    </app-value-help-button>
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
                private modalService: ModalService,            // Replaced NgbModal with ModalService
                private policyService: PolicyService) {
    }

    async ngOnInit() {
        this.loading = true;

        if (!this.actRoute.snapshot.params.hasOwnProperty("roleName") || !this.actRoute.snapshot.params.hasOwnProperty("tenantId")) {
            await this.router.navigate(["/RL01"]);
        }

        this.roleName = this.actRoute.snapshot.params['roleName'];
        this.tenantId = this.actRoute.snapshot.params['tenantId'];

        await this.reloadUsers();
        await this.reloadPolicies();

        this.authDefaultService.setTitle("RL02: " + this.role.name);

        this.loading = false;
    }

    async onUpdateRole() {
        // Show the update-role modal
        const modalResult: ModalResult<any> = await this.modalService.open(UpdateRoleModalComponent, {
            initData: {
                role: { ...this.role },
                tenantId: this.tenantId
            }
        });

        // If the user saved changes in the modal
        if (modalResult.is_ok()) {
            const updatedRole = modalResult.data;
            if (updatedRole) {
                this.role.name = updatedRole.name;
                this.role.description = updatedRole.description;
            }
        }
    }

    async onDeleteRole() {
        await this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            accept: async () => {
                await this.tenantService.deleteRole(this.role.name, this.role.tenantId);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'Group removed'});
                await this.router.navigate(["/RL01"]);
            }
        });
    }

    async reloadUsers() {
        try {
            let response = await this.roleService.getRoleDetails(this.tenantId, this.roleName);
            this.role = response.role;
            this.users = response.users;
        } catch (e: any) {
            console.error("Error reloading users:", e);
            this.messageService.add({severity: 'error', summary: 'Failed', detail: 'Could not load users'});
        }
    }

    async onUserRemove(user: any) {
        await this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            accept: async () => {

                await this.tenantService.removeRolesFromMember([this.role], this.tenantId, user.id);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'User removed'});
            }
        });
        await this.ngOnInit();
    }

    async onUserVhOpen() {
        try {
            const members = await this.tenantService.getMembers(this.tenantId);
            this.usersDM.setData(members);
        } catch (e) {
            this.messageService.add({
                severity: 'error',
                summary: 'Member Load Failed',
                detail: 'Could not load member'
            });
        }

    }

    async onUserVhClose(valueHelpResult: ValueHelpResult): Promise<void> {
        if (valueHelpResult.closeType === CloseType.Confirm) { // Only refresh if modal was closed with success
            try {
                const selectedUser = valueHelpResult.selection;
                for (let user of selectedUser) {
                    await this.tenantService.addRolesToMember(
                        [this.role],
                        this.tenantId,
                        user.id
                    );
                }
                const response = await this.roleService.getRoleDetails(this.tenantId, this.roleName);
                this.users = response.users;
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
        const modalResult: ModalResult<any> = await this.modalService.open(CreatePolicyModalComponent, {
            initData: {
                role_id: this.role.id
            }
        });

        if (modalResult.is_ok()) {
            const createdPolicy = modalResult.data;
            if (createdPolicy) {
                await this.reloadPolicies();
            }
        }
    }

    async openUpdatePolicyModal(policyId: string): Promise<void> {
        const modalResult: ModalResult<any> = await this.modalService.open(CreatePolicyModalComponent, {
            initData: {
                role_id: this.role.id,
                policyId: policyId
            }
        });

        if (modalResult.is_ok()) {
            const updatedPolicy = modalResult.data;
            if (updatedPolicy) {
                await this.reloadPolicies();
            }
        }
    }

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
        const modalResult: ModalResult<any> = await this.modalService.open(CreatePolicyModalComponent, {
            initData: {
                policyId: policyId,
                viewOnly: true
            }
        });

        // If read-only, it may not return updated data, so no further logic is necessary
        if (modalResult.is_ok()) {
            // Optionally handle data if your read-only modal returns anything
        }
    }

    isEmpty(obj: any) {
        for (const prop in obj) {
            return false;
        }
        return true;
    }

}
