import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {lastValueFrom} from "rxjs";
import {VHAsyncLoadEvent} from "../../component/value-help-input/value-help-input.component";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";


@Component({
    selector: 'app-role-list',
    template: `
        <nav-bar></nav-bar>
        <div *ngIf="!loading" class="container-fluid">
            <div class="row mb-2">
                <div class="col-6">
                    <div class="row my-2">
                        <div class="col-auto ">
                            <div class="form-group input-group">
                                <span class="input-group-text" style="min-width: 5rem;">User </span>
                                <input
                                    class="form-control text-truncate"
                                    readonly
                                    required
                                    type="text"
                                    value="{{email}}"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-auto">
                            <div class="form-group input-group">
                                <span class="input-group-text" style="min-width: 5rem;">Tenant </span>
                                <input
                                    class="form-control text-truncate"
                                    readonly
                                    required
                                    type="text"
                                    value="{{tenant.domain}}"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="row mt-2 ">
                        <div class="col ">
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
                                Assign Role
                            </button>
                        </div>

                    </div>
                </div>
            </div>


            <div class="row mt-2">
                <div class="col-xl-12">
                    <div class="card my-2">
                        <p-table [value]="member.roles" responsiveLayout="scroll">
                            <ng-template pTemplate="caption">
                                <div class="d-flex justify-content-between">
                                    <h5>Role List</h5>
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
                <div class="">
                </div>

            </div>
        </div>
    `,
    styles: ['']
})
export class RoleListComponent implements OnInit {

    tenantId: string = '';
    email: string = '';
    member: any = {
        roles: []
    };
    user: any;
    tenant: any;
    loading = true;
    tenantRoles: any;
    selectedRoles: any[] = [];

    constructor(private userService: UserService,
                private tenantService: TenantService,
                private route: ActivatedRoute,
                private router: Router,
                private messageService: MessageService,
                private authDefaultService: AuthDefaultService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.authDefaultService.setTitle("Manage Role Assignments");

        this.tenantId = this.route.snapshot.params['tenantId'];
        this.email = this.route.snapshot.params['email'];

        // let params = this.route.snapshot.queryParamMap;
        // if (!params.has('email') || !params.has('tenantId')) {
        //     await this.router.navigate(['/role-sel']);
        // }
        // this.email = params.get('email') as string;
        // this.tenantId = params.get('tenantId') as string;
        if (!this.email || !this.tenantId) {
            await this.router.navigate(['/RL02']);
        }

        this.tenant = await this.tenantService.getTenantDetails(this.tenantId);
        this.user = await lastValueFrom(this.userService.getUser(this.email));
        try {

            await this.loadTable();
            this.tenantRoles = this.tenant.roles;
            this.loading = false;

        } catch (exception: any) {
            console.log(exception);
            this.messageService.add({severity: 'error', summary: 'Failed', detail: exception.error.message});
        }

    }

    async loadTable() {
        if (this.tenantId && this.email) {
            this.member = await this.tenantService.getMemberDetails(this.tenantId, this.email);
        }
    }

    openCreateModal() {

    }

    openUpdateModal(user: any) {

    }

    openDeleteModal(user: any) {

    }

    async onAddRole() {
        await this.tenantService.assignRole(this.selectedRoles, this.tenantId, this.email);
        await this.loadTable();
        this.selectedRoles = [];
    }

    onRemoveRole(role: any) {

    }

    provideRoles($event: VHAsyncLoadEvent) {
        $event.update(this.tenantRoles, []);
    }

    onAddRoleSelection(selected: any[]) {

    }
}
