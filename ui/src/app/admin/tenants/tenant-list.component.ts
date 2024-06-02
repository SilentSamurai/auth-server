import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateTenantComponent} from "./create-tenant.component";
import {UpdateTenantComponent} from "./update-tenant.component";
import {DeleteTenantComponent} from "./delete-tenant/delete-tenant.component";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {AppTableComponent, TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {Filter} from "../../component/filter-bar/filter-bar.component";

@Component({
    selector: 'app-board-tenants',
    templateUrl: './tenant-list.component.html',
    styleUrls: ['./tenant-list.component.css']
})
export class TenantListComponent implements OnInit {

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
