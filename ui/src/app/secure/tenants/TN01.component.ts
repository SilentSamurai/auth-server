import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateTenantComponent} from "./create-tenant.component";
import {UpdateTenantComponent} from "./update-tenant.component";
import {DeleteTenantComponent} from "./delete-tenant.component";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {AppTableComponent, TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {Filter} from "../../component/filter-bar/filter-bar.component";

@Component({
    selector: 'app-TN01',
    template: `
        <nav-bar></nav-bar>
        <div class="container-fluid">
            <div class="row">

                <div class="col-md-12">
                    <div class="card my-2">
                        <div class="card-header bg-dark-subtle">
                            <div class="d-flex justify-content-between">
                                <h5>Tenant List</h5>
                                <button (click)="openCreateModal()" [disabled]="!this.creationAllowed"
                                        class="btn btn-success btn-sm"
                                        type="button">
                                    <i class="fa fa-solid fa-plus me-2"></i> Add Tenant
                                </button>
                            </div>
                            <app-fb (onFilter)="onFilter($event)">
                                <app-fb-col label="Tenant Id" name="id"></app-fb-col>
                                <app-fb-col label="Name" name="name"></app-fb-col>
                                <app-fb-col label="Domain" name="domain"></app-fb-col>
                            </app-fb>
                        </div>
                        <div class="card-body p-0">
                            <app-table
                                (onLoad)="lazyLoad($event)"
                                idField="id"
                                isFilterAsync="true"
                                multi="true"
                                scrollHeight="75vh">

                                <app-table-col label="Tenant Id" name="id"></app-table-col>
                                <app-table-col label="Name" name="name"></app-table-col>
                                <app-table-col label="Domain" name="domain"></app-table-col>
                                <app-table-col label="Action" name="action"></app-table-col>

                                <ng-template #table_body let-tenant>
                                    <td>
                                        <span class="p-column-title">Name</span>
                                        <a [routerLink]="['/tenant/', tenant.id]"
                                           href="javascript:void(0)">{{ tenant.id }}</a>
                                    </td>
                                    <td><span class="p-column-title">Name</span>{{ tenant.name }}</td>
                                    <td><span class="p-column-title">Domain</span>{{ tenant.domain }}</td>
                                    <td class="d-flex ">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>


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
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        // this.tenants = await lastValueFrom(this.tenantService.getAllTenants());
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
