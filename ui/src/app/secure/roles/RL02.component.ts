import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {RoleService} from "../../_services/role.service";
import {MessageService} from "primeng/api";
import {ConfirmationService} from "../../component/dialogs/confirmation.service";

@Component({
    selector: 'app-group-object',
    template: `
        <nav-bar></nav-bar>
        <app-object-page *ngIf="!loading">
            <app-object-page-title>
                {{ role.name }}
            </app-object-page-title>
            <app-object-page-subtitle>
                {{ role.tenant.name }}
            </app-object-page-subtitle>
            <app-object-page-actions>
                <button (click)="onUpdateRole()"
                        class="btn btn-primary btn-sm me-2">
                    Update
                </button>

                <button (click)="onDeleteRole()"
                        class="btn btn-danger btn-sm">
                    Delete
                </button>
            </app-object-page-actions>
            <app-object-page-header>
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
            </app-object-page-header>
            <app-object-page-section
                name="Users">
                <p-table [value]="users" responsiveLayout="scroll">
                    <ng-template pTemplate="caption">
                        <div class="d-flex justify-content-between">
                            <h5>Users </h5>
                            <div style="min-width:15rem">
                                <app-value-help-input
                                    (dataProvider)="provideUsers($event)"
                                    [(selection)]="selectedUsers"
                                    class="col-3"
                                    idField="id"
                                    labelField="name"
                                    multi="true"
                                    name="Users">

                                    <app-vh-col label="Email" name="email"></app-vh-col>

                                    <ng-template #vh_body let-row>
                                        <td>{{ row.email }}</td>
                                    </ng-template>

                                </app-value-help-input>

                                <button (click)="onAddUsers()"
                                        class="btn btn-primary btn-sm mt-2">
                                    Assign Users
                                </button>
                            </div>
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
            </app-object-page-section>
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
                private modalService: NgbModal) {
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

    async onAddUsers() {
        if (this.selectedUsers.length > 0) {
            await this.roleService.addUser(this.tenantId, this.roleName, this.selectedUsers.map(r => r.email));
            await this.ngOnInit();
        }
    }

    async provideUsers($event: TableAsyncLoadEvent) {
        let members = await this.tenantService.getMembers(this.tenantId);
        $event.update(members);
    }


}
