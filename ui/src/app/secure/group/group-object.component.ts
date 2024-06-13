import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfirmationService, MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {GroupService} from "../../_services/group.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {UpdateGroupComponent} from "./update-group.component";

@Component({
    selector: 'app-group-object',
    template: `
        <nav-bar></nav-bar>
        <div class="container-fluid mb-5" *ngIf="!loading">
            <div class="row card">
                <div class="col card-body">
                    <div class="row">
                        <div class="col">

                        <div class=" my-2 mb-4">
                                <div class="p-disabled">Name</div>
                                <h4>{{ group.name }}</h4>
                            </div>
                            <div class="my-2">
                                <div class="p-disabled">Tenant Id</div>
                                <div>{{ group.tenant.id }}</div>
                            </div>
                            <div class="my-2">
                                <div class="p-disabled">Tenant Name</div>
                                <div>{{ group.tenant.name }}</div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="d-flex justify-content-between total font-weight-bold mt-4">
                                <button (click)="onUpdateGroup()"
                                        class="btn btn-primary btn-sm">
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <ul class="nav nav-tabs" id="myTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active"
                                id="home-tab" data-bs-toggle="tab"
                                data-bs-target="#home"
                                type="button" role="tab"
                                aria-controls="home" aria-selected="true">
                            Roles
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link"
                                id="profile-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#profile" type="button" role="tab"
                                aria-controls="profile" aria-selected="false">
                            Users
                        </button>
                    </li>
                </ul>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <div class="tab-content" id="myTabContent">
                        <div class="tab-pane fade show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                            <p-table [value]="roles" responsiveLayout="scroll">
                                <ng-template pTemplate="caption">
                                    <div class="d-flex justify-content-between">
                                        <h5>Roles </h5>

                                        <div style="min-width:15rem">
                                            <app-value-help-input
                                                (dataProvider)="provideRoles($event)"
                                                [(selection)]="selectedRoles"
                                                class="col-3"
                                                idField="id"
                                                labelField="name"
                                                multi="true"
                                                name="Roles">

                                                <app-vh-col label="Name" name="name"></app-vh-col>

                                                <ng-template #vh_body let-row>
                                                    <td>{{ row.name }}</td>
                                                </ng-template>

                                            </app-value-help-input>

                                            <button (click)="onAddRole()"
                                                    class="btn btn-primary btn-sm mt-2">
                                                Assign Roles
                                            </button>
                                        </div>


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
                                                    class="btn btn-sm"
                                                    type="button">
                                                <i class="fa fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                        <div class="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">
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
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="text-center" *ngIf="loading">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <p-confirmDialog></p-confirmDialog>


    `,
    styles: [''],
    providers: [ConfirmationService, MessageService]
})
export class GroupObjectComponent implements OnInit {

    loading = true;
    group: any;
    users: any[] = [];
    roles: any[] = [];
    selectedRoles: any[] = [];
    selectedUsers: any[] = [];
    private group_id: any;

    constructor(private tenantService: TenantService,
                private tokenStorageService: TokenStorageService,
                private messageService: MessageService,
                private groupService: GroupService,
                private actRoute: ActivatedRoute,
                private router: Router,
                private authDefaultService: AuthDefaultService,
                private confirmationService: ConfirmationService,
                private modalService: NgbModal) {
    }

    async ngOnInit() {
        this.loading = true;
        this.authDefaultService.setTitle("Group Details");
        if (!this.actRoute.snapshot.params.hasOwnProperty("groupId")) {
            await this.router.navigate(["/GP02"]);
        }

        this.group_id = this.actRoute.snapshot.params['groupId'];

        let response = await this.groupService.getGroupDetail(this.group_id);

        this.group = response.group;
        this.users = response.users;
        this.roles = response.roles;

        this.authDefaultService.setTitle("Group: " + this.group.name);

        this.loading = false;
    }

    async onUpdateGroup() {
        const modalRef = this.modalService.open(UpdateGroupComponent);
        modalRef.componentInstance.groupId = this.group_id;
        const user = await modalRef.result;
        console.log(user);
        this.ngOnInit();
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
                await this.groupService.removeUser(this.group_id, [user.email]);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'User removed'});
                await this.ngOnInit();
            },
            reject: () => {

            }
        })
    }

    async onAddUsers() {
        if (this.selectedUsers.length > 0) {
            await this.groupService.addUser(this.group_id, this.selectedUsers.map(r => r.email));
            await this.ngOnInit();
        }
    }

    async provideUsers($event: TableAsyncLoadEvent) {
        let members = await this.tenantService.getMembers(this.group.tenantId);
        $event.update(members);
    }

    async provideRoles($event: TableAsyncLoadEvent) {
        let roles = await this.tenantService.getTenantRoles(this.group.tenantId);
        $event.update(roles);
    }

    async onAddRole() {
        if (this.selectedRoles.length > 0) {
            await this.groupService.addRoles(this.group_id, this.selectedRoles.map(r => r.name));
            await this.ngOnInit();
        }
    }

    async onRemoveRole(role: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            acceptIcon: "none",
            rejectIcon: "none",
            rejectButtonStyleClass: "p-button-text",
            accept: async () => {
                await this.groupService.removeRoles(this.group_id, [role.name]);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'Role removed'});
                await this.ngOnInit();
            },
            reject: () => {

            }
        })

    }


}
