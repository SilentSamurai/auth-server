import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {GroupService} from "../../_services/group.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {UpdateGroupComponent} from "./dialogs/update-group.component";
import {MessageService} from "primeng/api";
import {ConfirmationService} from "../../component/dialogs/confirmation.service";

@Component({
    selector: 'app-group-object',
    template: `
        <nav-bar></nav-bar>
        <app-object-page *ngIf="!loading">
            <app-object-page-title>
                {{ group.name }}
            </app-object-page-title>
            <app-object-page-subtitle>
                {{ group.tenant.name }}
            </app-object-page-subtitle>
            <app-object-page-actions>
                <button (click)="onUpdateGroup()"
                        class="btn btn-primary btn-sm me-2">
                    Update
                </button>

                <button (click)="onDeleteGroup()"
                        class="btn btn-danger btn-sm">
                    Delete
                </button>
            </app-object-page-actions>
            <app-object-page-header>
                <div class="row">
                    <div class="col-md">
                        <app-attribute label="Group Name" valueClass="">
                            {{ group.name }}
                        </app-attribute>
                        <app-attribute label="Description" valueClass="">
                            {{ group.description }}
                        </app-attribute>
                    </div>
                    <div class="col-md">
                        <app-attribute label="Tenant Id">
                            {{ group.tenant.id }}
                        </app-attribute>
                        <app-attribute label="Tenant Name">
                            {{ group.tenant.name }}
                        </app-attribute>
                    </div>
                </div>
            </app-object-page-header>

            <app-object-page-section name="Roles">
                <p-table [value]="roles" responsiveLayout="scroll">
                    <ng-template pTemplate="caption">
                        <div class="d-flex justify-content-between">
                            <h5>Roles </h5>

                            <div style="min-width:15rem">
<!--                                <app-value-help-input-->
<!--                                    (dataProvider)="provideRoles($event)"-->
<!--                                    [(selection)]="selectedRoles"-->
<!--                                    class="col-3"-->
<!--                                    idField="id"-->
<!--                                    labelField="name"-->
<!--                                    multi="true"-->
<!--                                    name="Roles">-->

<!--                                    <app-vh-col label="Name" name="name"></app-vh-col>-->

<!--                                    <ng-template #vh_body let-row>-->
<!--                                        <td>{{ row.name }}</td>-->
<!--                                    </ng-template>-->

<!--                                </app-value-help-input>-->

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
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template let-columns="columns" let-role pTemplate="body">
                        <tr>
                            <td>
                                <a [routerLink]="['/RL02', group.tenant.id, role.name]"
                                   href="javascript:void(0)">{{ role.name }}</a>
                            </td>
                            <td></td>
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
            </app-object-page-section>

            <app-object-page-section name="Users">
                <p-table [value]="users" responsiveLayout="scroll">
                    <ng-template pTemplate="caption">
                        <div class="d-flex justify-content-between">
                            <h5>Users </h5>
                            <div style="min-width:15rem">
<!--                                <app-value-help-input-->
<!--                                    (dataProvider)="provideUsers($event)"-->
<!--                                    [(selection)]="selectedUsers"-->
<!--                                    class="col-3"-->
<!--                                    idField="id"-->
<!--                                    labelField="name"-->
<!--                                    multi="true"-->
<!--                                    name="Users">-->

<!--                                    <app-vh-col label="Email" name="email"></app-vh-col>-->

<!--                                    <ng-template #vh_body let-row>-->
<!--                                        <td>{{ row.email }}</td>-->
<!--                                    </ng-template>-->

<!--                                </app-value-help-input>-->

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
                            <th>Assignments</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template let-columns="columns" let-user pTemplate="body">
                        <tr>
                            <td>{{ user.name }}</td>
                            <td>
                                <a [routerLink]="['/UR02', user.email]"
                                   href="javascript:void(0)">{{ user.email }}</a>
                            </td>
                            <td>
                                <a [routerLink]="['/TNRL01', group.tenant.id, user.email]"
                                   href="javascript:void(0)">View Assignments</a>

                            </td>
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
        <div class="text-center" *ngIf="loading">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <p-confirmDialog></p-confirmDialog>
    `,
    styles: [''],
    providers: []
})
export class GP02Component implements OnInit {

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
        modalRef.componentInstance.form.name = this.group.name;
        const group = await modalRef.result;
        console.log(group);
        this.ngOnInit();
    }

    onDeleteGroup() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            accept: async () => {
                await this.groupService.deleteGroup(this.group_id);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'Group removed'});
                await this.router.navigate(["/GP01"]);
            }
        })
    }


    onUserRemove(user: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            accept: async () => {
                await this.groupService.removeUser(this.group_id, [user.email]);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'User removed'});
                await this.ngOnInit();
            }
        })
    }

    async onAddUsers() {
        if (this.selectedUsers.length > 0) {
            await this.groupService.addUser(this.group_id, this.selectedUsers.map(r => r.email));
            await this.ngOnInit();
        }
    }

    // async provideUsers($event: TableAsyncLoadEvent) {
    //     let members = await this.tenantService.getMembers(this.group.tenantId);
    //     $event.update(members, false);
    // }
    //
    // async provideRoles($event: TableAsyncLoadEvent) {
    //     let roles = await this.tenantService.getTenantRoles(this.group.tenantId);
    //     $event.update(roles, false);
    // }

    async onAddRole() {
        if (this.selectedRoles.length > 0) {
            await this.groupService.addRoles(this.group_id, this.selectedRoles.map(r => r.name));
            await this.ngOnInit();
        }
    }

    async onRemoveRole(role: any) {
        await this.confirmationService.confirm({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            accept: async () => {
                await this.groupService.removeRoles(this.group_id, [role.name]);
                this.messageService.add({severity: 'info', summary: 'Successful', detail: 'Role removed'});
                await this.ngOnInit();
            }
        })

    }


}
