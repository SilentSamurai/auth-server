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
    selector: 'app-TNRL01',
    template: `
        <nav-bar></nav-bar>
        <app-object-page *ngIf="!loading">

            <app-object-page-header>
                <div class="row mb-2">
                    <div class="col">
                        <div class=" my-2 mb-4">
                            <div class="p-disabled">Email</div>
                            <h4>{{ user.email }}</h4>
                        </div>
                        <div class=" my-2 mb-4">
                            <div class="p-disabled">Name</div>
                            <div>{{ user.name }}</div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="my-2">
                            <div class="p-disabled">Tenant Name</div>
                            <h5>{{ tenant.name }}</h5>
                        </div>
                        <div class="my-2">
                            <div class="p-disabled">Tenant Id</div>
                            <div>{{ tenant.id }}</div>
                        </div>
                    </div>
                </div>
            </app-object-page-header>

            <app-object-page-section name="Roles">
                <p-table [value]="member.roles" responsiveLayout="scroll">
                    <ng-template pTemplate="caption">
                        <div class="d-flex justify-content-between">
                            <h5>Role List</h5>

                            <div class="" style="min-width:15rem">
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
            </app-object-page-section>
        </app-object-page>
    `,
    styles: ['']
})
export class TNRL01Component implements OnInit {

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
