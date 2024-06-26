import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateTenantComponent} from "./dialogs/create-tenant.component";
import {UpdateTenantComponent} from "./dialogs/update-tenant.component";
import {DeleteTenantComponent} from "./dialogs/delete-tenant.component";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {AppTableComponent, TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {Filter} from "../../component/filter-bar/filter-bar.component";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'app-TN01',
    template: `
        <nav-bar></nav-bar>
        <app-page-view>
            <app-page-view-header>
                <div class="">
                    <app-fb (onFilter)="onFilter($event)">
                        <app-fb-col label="Tenant Id" name="id"></app-fb-col>
                        <app-fb-col label="Name" name="name"></app-fb-col>
                        <app-fb-col label="Domain" name="domain"></app-fb-col>
                    </app-fb>
                    <div class="d-flex justify-content-between mt-2">
                        <div></div>
                        <button (click)="openCreateModal()" [disabled]="!this.creationAllowed"
                                class="btn btn-outline-success btn-sm"
                                type="button">
                            <i class="fa fa-solid fa-plus me-2"></i> Create Tenant
                        </button>
                    </div>

                </div>
            </app-page-view-header>

            <app-page-view-body>
                <app-table
                    title="Tenant List"
                    (onLoad)="lazyLoad($event)"
                    idField="id"
                    isFilterAsync="true"
                    multi="true"
                    scrollHeight="75vh">

                    <app-table-col label="Tenant Id" name="id"></app-table-col>
                    <app-table-col label="Name" name="name"></app-table-col>
                    <app-table-col label="Domain" name="domain"></app-table-col>
                    <app-table-col>
                        <th style="max-width: 100px">Action</th>
                    </app-table-col>

                    <ng-template #table_body let-tenant>
                        <td>
                            <span class="p-column-title">Name</span>
                            <a [routerLink]="['/TN02/', tenant.id]"
                               href="javascript:void(0)">{{ tenant.id }}</a>
                        </td>
                        <td>{{ tenant.name }}</td>
                        <td>{{ tenant.domain }}</td>
                        <td class="" style="max-width: 100px">
                            <button (click)="openUpdateModal(tenant)" [disabled]="!this.isTenantAdmin"
                                    class="btn"
                                    type="button">
                                <i class="fa fa-edit"></i>
                            </button>
                            <button (click)="openDeleteModal(tenant)" [disabled]="!this.creationAllowed"
                                    class="btn"
                                    type="button">
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
export class TN01Component implements OnInit {

    @ViewChild(AppTableComponent)
    table!: AppTableComponent;

    tenants: any = [];
    creationAllowed = false;
    isTenantAdmin = false;

    constructor(private tokenStorageService: TokenStorageService,
                private tenantService: TenantService,
                private authDefaultService: AuthDefaultService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        // this.tenants = await lastValueFrom(this.tenantService.getAllTenants());
        this.authDefaultService.setTitle("TN01: Manage Tenants");
        if (this.tokenStorageService.isSuperAdmin()) {
            this.creationAllowed = true;
        }
        if (this.tokenStorageService.isTenantAdmin()) {
            this.isTenantAdmin = true;
        }
    }

    async openCreateModal() {
        const modalRef = this.modalService.open(CreateTenantComponent);
        const tenant = await modalRef.result;
        console.log("returned tenant", tenant);
        await this.ngOnInit();
    }

    async openUpdateModal(tenant: any) {
        const modalRef = this.modalService.open(UpdateTenantComponent);
        modalRef.componentInstance.tenant = tenant;
        const editedTenant = await modalRef.result;
        console.log(editedTenant);
        await this.ngOnInit();
    }

    async openDeleteModal(tenant: any) {
        const modalRef = this.modalService.open(DeleteTenantComponent);
        modalRef.componentInstance.tenant = tenant;
        const deletedTenant = await modalRef.result;
        console.log(deletedTenant);
        await this.ngOnInit();
    }

    async lazyLoad($event: TableAsyncLoadEvent) {
        this.tenants = await this.tenantService.queryTenant({
            pageNo: $event.pageNo,
            where: $event.filters.filter(item => item.value != null && item.value.length > 0),
        });
        $event.update(this.tenants.data);
    }

    onFilter(event: Filter[]) {
        this.table.filter(event);
    }
}
