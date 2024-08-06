import {AfterContentInit, Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {lastValueFrom} from "rxjs";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {StaticModel} from "../../component/model/StaticModel";



@Component({
    selector: 'app-TNRL01',
    template: `
        <nav-bar></nav-bar>
        <app-object-page *ngIf="!loading">
            <app-object-page-title>
                {{ user.email }}
            </app-object-page-title>
            <app-object-page-subtitle>
                {{ tenant.name }}
            </app-object-page-subtitle>

            <app-object-page-actions>
                <div class="" style="min-width:15rem">
                    <app-value-help-input
                        [dataModel]="tenantRolesDM"
                        [(selection)]="selectedRoles"
                        class="col-3"
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
            </app-object-page-actions>

            <app-object-page-header>
                <div class="row mb-2">
                    <div class="col">
                        <app-attribute label="Email">
                            {{ user.email }}
                        </app-attribute>
                        <app-attribute label="Name">
                            {{ user.name }}
                        </app-attribute>
                    </div>
                    <div class="col">
                        <app-attribute label="Tenant Name">
                            {{ tenant.name }}
                        </app-attribute>
                        <app-attribute label="Tenant Id">
                            {{ tenant.id }}
                        </app-attribute>
                    </div>
                </div>
            </app-object-page-header>

            <app-object-page-section name="Roles">
                <app-table title="Role List"
                           [dataModel]="rolesDataModel"
                >

                    <app-table-col label="Name" name="name"></app-table-col>
                    <app-table-col label="Description" name="description"></app-table-col>
                    <app-table-col label="Actions" name="actions"></app-table-col>

                    <ng-template let-role #table_body>
                        <td>
                            <a [routerLink]="['/RL02', tenant.id, role.name]"
                               href="javascript:void(0)">{{ role.name }}</a>
                        </td>
                        <td>
                            {{ role.description }}
                        </td>
                        <td>
                            <button (click)="onRemoveRole(role)"
                                    *ngIf="role.removable"
                                    class="btn btn-sm"
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
export class TNRL01Component implements AfterContentInit {

    tenantId: string = '';
    userId: string = '';
    member: any = {
        roles: []
    };
    roles = [];
    user: any;
    tenant: any;
    loading = true;
    tenantRoles: any;
    selectedRoles: any[] = [];
    rolesDataModel = new StaticModel(["id"]);
    tenantRolesDM = new StaticModel(["id"]);

    constructor(private userService: UserService,
                private tenantService: TenantService,
                private route: ActivatedRoute,
                private router: Router,
                private messageService: MessageService,
                private authDefaultService: AuthDefaultService,
                private modalService: NgbModal) {

    }



    async ngOnInit(): Promise<void> {
        this.authDefaultService.setTitle("TNRL01: Role Assignment of User");

        this.tenantId = this.route.snapshot.params['tenantId'];
        this.userId = this.route.snapshot.params['userId'];

        // let params = this.route.snapshot.queryParamMap;
        // if (!params.has('email') || !params.has('tenantId')) {
        //     await this.router.navigate(['/role-sel']);
        // }
        // this.email = params.get('email') as string;
        // this.tenantId = params.get('tenantId') as string;
        if (!this.userId || !this.tenantId) {
            await this.router.navigate(['/home']);
        }

        this.tenant = await this.tenantService.getTenantDetails(this.tenantId);
        this.user = await lastValueFrom(this.userService.getUser(this.userId));
        try {

            await this.loadTable();
            this.tenantRoles = this.tenant.roles;
            this.tenantRolesDM.setData(this.tenantRoles);
            this.loading = false;

        } catch (exception: any) {
            console.log(exception);
            this.messageService.add({severity: 'error', summary: 'Failed', detail: exception.error.message});
        }

    }

    ngAfterContentInit(): void {

    }

    async loadTable() {
        if (this.tenantId && this.userId) {
            this.member = await this.tenantService.getMemberDetails(this.tenantId, this.userId);
            // $event.update(this.member, false);
            this.roles = this.member.roles;
            this.rolesDataModel.setData(this.roles);
        }
    }

    openCreateModal() {

    }

    openUpdateModal(user: any) {

    }

    openDeleteModal(user: any) {

    }

    async onAddRole() {
        await this.tenantService.assignRole(this.selectedRoles, this.tenantId, this.userId);
        await this.loadTable();
        this.selectedRoles = [];
    }

    onRemoveRole(role: any) {

    }

    // provideRoles($event: TableAsyncLoadEvent) {
    //     $event.update(this.tenantRoles, false);
    // }

    onAddRoleSelection(selected: any[]) {

    }


}
