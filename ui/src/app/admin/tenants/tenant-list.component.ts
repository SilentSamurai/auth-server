import {Component, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateTenantComponent} from "./create-tenant/create-tenant.component";
import {UpdateTenantComponent} from "./update-tenant/update-tenant.component";
import {DeleteTenantComponent} from "./delete-tenant/delete-tenant.component";
import {lastValueFrom} from "rxjs";
import {TenantService} from "../../_services/tenant.service";
import {TokenStorageService} from "../../_services/token-storage.service";

@Component({
    selector: 'app-board-tenants',
    templateUrl: './tenant-list.component.html',
    styleUrls: ['./tenant-list.component.css']
})
export class TenantListComponent implements OnInit {

    tenants: any[] = [];
    creationAllowed = false;
    isTenantAdmin = false;

    constructor(private tokenStorageService: TokenStorageService,
                private tenantService: TenantService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.tenants = await lastValueFrom(this.tenantService.getAllTenants());
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
}
