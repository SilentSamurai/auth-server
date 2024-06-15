import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfirmationService, MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {RoleService} from "../../_services/role.service";

@Component({
    selector: 'app-group-object',
    template: `
        <nav-bar></nav-bar>
        <app-object-page *ngIf="!loading">
            <app-object-page-header>
                <div class="row">
                    <div class="col">
                        <div class=" my-2 mb-4">
                            <div class="p-disabled">Name</div>
                            <h4>{{ role.name }}</h4>
                        </div>
                        <div class="my-2">
                            <div class="p-disabled">Tenant Id</div>
                            <div>{{ role.tenant.id }}</div>
                        </div>
                        <div class="my-2">
                            <div class="p-disabled">Tenant Name</div>
                            <div>{{ role.tenant.name }}</div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="d-flex justify-content-end total font-weight-bold mt-4">
                            <button (click)="onUpdateGroup()"
                                    class="btn btn-primary btn-sm me-2">
                                Update
                            </button>

                            <button (click)="onDeleteGroup()"
                                    class="btn btn-danger btn-sm">
                                Delete
                            </button>
                        </div>
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
    styles: [''],
    providers: [ConfirmationService, MessageService]
})
export class RL02Component implements OnInit {

    loading = true;
    role: any = {
        name: "Role 1",
        tenant: {
            id: "wegwegweg",
            name: "Tenant 1"
        }
    };
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
        this.authDefaultService.setTitle("Role Details");

        if (!this.actRoute.snapshot.params.hasOwnProperty("roleName") || !this.actRoute.snapshot.params.hasOwnProperty("tenantId")) {
            await this.router.navigate(["/RL01"]);
        }

        this.roleName = this.actRoute.snapshot.params['roleName'];
        this.tenantId = this.actRoute.snapshot.params['tenantId'];

        let response = await this.roleService.getRoleDetails(this.tenantId, this.roleName);

        this.role = response.role;
        this.users = response.users;

        this.authDefaultService.setTitle("Role: " + this.role.name);

        this.loading = false;
    }

    async onUpdateGroup() {
        // const modalRef = this.modalService.open(UpdateGroupComponent);
        // modalRef.componentInstance.groupId = this.group_id;
        // const user = await modalRef.result;
        // console.log(user);
        this.ngOnInit();
    }

    onDeleteGroup() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            acceptIcon: "none",
            rejectIcon: "none",
            rejectButtonStyleClass: "p-button-text",
            accept: async () => {
                await this.roleService.deleteRole(this.role.tenantId, this.role.name);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'Group removed'});
                await this.router.navigate(["/GP01"]);
            },
            reject: () => {

            }
        })
    }


    onUserRemove(user: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            acceptIcon: "none",
            rejectIcon: "none",
            rejectButtonStyleClass: "p-button-text",
            accept: async () => {
                await this.roleService.removeUser(this.tenantId, this.roleName, [user.email]);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'User removed'});
                await this.ngOnInit();
            },
            reject: () => {

            }
        })
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
