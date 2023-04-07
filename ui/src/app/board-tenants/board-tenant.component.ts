import {Component, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateTenantComponent} from "./create-tenant/create-tenant.component";
import {UpdateTenantComponent} from "./update-tenant/update-tenant.component";
import {DeleteTenantComponent} from "./delete-tenant/delete-tenant.component";
import {lastValueFrom} from "rxjs";
import {TenantService} from "../_services/tenant.service";

@Component({
    selector: 'app-board-tenants',
    templateUrl: './board-tenant.component.html',
    styleUrls: ['./board-tenant.component.css']
})
export class BoardTenantComponent implements OnInit {

    tenants: any[] = [];

    constructor(private tenantService: TenantService, private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.tenants = await lastValueFrom(this.tenantService.getAllTenants());
    }

    async openCreateModal() {
        const modalRef = this.modalService.open(CreateTenantComponent);
        const tenant = await modalRef.result;
        console.log(tenant);
        await this.ngOnInit();
    }

    async openUpdateModal(tenant: any) {
        const modalRef = this.modalService.open(UpdateTenantComponent);
        modalRef.componentInstance.tenant = tenant;
        const editedTenant = await modalRef.result;
        console.log(editedTenant);
        await this.ngOnInit();
    }

    openDeleteModal(tenant: any) {
        const modalRef = this.modalService.open(DeleteTenantComponent);
        modalRef.componentInstance.tenant = tenant;
    }
}
