import {Component, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {Filter} from "../../component/filter-bar/filter-bar.component";
import {AppTableComponent, TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {RoleService} from "../../_services/role.service";


@Component({
    selector: 'app-role-list',
    template: `
        <nav-bar></nav-bar>
        <app-page-view>
            <app-page-view-header>
                <div class="d-flex justify-content-between">
                    <span class="h4">Roles</span>
                </div>
                <app-fb (onFilter)="onFilter($event)">
                    <app-fb-col label="Name" name="name"></app-fb-col>
                    <app-fb-col label="Email" name="users/email"></app-fb-col>
                    <app-fb-col label="Tenant" name="tenants/name"></app-fb-col>
                </app-fb>
            </app-page-view-header>
            <app-page-view-body>
                <app-table
                    (onLoad)="loadTable($event)"
                    idField="id"
                    isFilterAsync="true"
                    multi="true"
                    scrollHeight="75vh">

                    <app-table-col label="Name" name="name"></app-table-col>
                    <app-table-col label="Tenant Id" name="tenants/id"></app-table-col>
                    <app-table-col label="Tenant Name" name="tenants/id"></app-table-col>
                    <app-table-col label="Create At" name="createdAt"></app-table-col>
                    <app-table-col label="Action" name="action"></app-table-col>

                    <ng-template #table_body let-role>
                        <td>
                            <a [routerLink]="['/RL02/', role.tenant.id, role.name]"
                               href="javascript:void(0)">{{ role.name }}</a>
                        </td>
                        <td>
                            <a [routerLink]="['/TN02/', role.tenant.id]"
                               href="javascript:void(0)">{{ role.tenant.id }}</a>
                        </td>
                        <td>{{ role.tenant.name }}</td>
                        <td>{{ role.createdAt | date }}</td>
                        <td class="d-flex ">
                            <button (click)="openDeleteModal(role)" class="btn " type="button">
                                <i class="fa fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </ng-template>
                </app-table>
            </app-page-view-body>
        </app-page-view>

    `,
    styles: ['']
})
export class RL01Component implements OnInit {

    @ViewChild(AppTableComponent)
    table!: AppTableComponent;

    roles: any;

    constructor(private userService: UserService,
                private tenantService: TenantService,
                private roleService: RoleService,
                private route: ActivatedRoute,
                private router: Router,
                private messageService: MessageService,
                private authDefaultService: AuthDefaultService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.authDefaultService.setTitle("RL01: Role List");

    }

    async loadTable($event: TableAsyncLoadEvent) {
        this.roles = await this.roleService.queryRoles({
            pageNo: $event.pageNo,
            where: $event.filters.filter(item => item.value != null && item.value.length > 0),
            expand: ["Tenants"]
        });
        $event.update(this.roles.data);
    }

    onFilter(filters: Filter[]) {
        this.table.filter(filters);
    }

    openDeleteModal(role: any) {

    }
}
