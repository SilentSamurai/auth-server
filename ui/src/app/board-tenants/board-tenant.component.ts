import {Component, OnInit} from '@angular/core';
import {firstValueFrom, lastValueFrom} from "rxjs";
import {TenantService} from "../_services/tenant.service";
import {TokenStorageService} from "../_services/token-storage.service";
import {DialogService} from "primeng/dynamicdialog";
import {CreateTenantComponent} from "./create-tenant/create-tenant.component";

@Component({
    selector: 'app-board-tenants',
    templateUrl: './board-tenant.component.html',
    styleUrls: ['./board-tenant.component.scss'],
    providers: [DialogService]
})
export class BoardTenantComponent implements OnInit {

    tenants: any[] = [];
    creationAllowed = false;
    isTenantAdmin = false;

    constructor(private tokenStorageService: TokenStorageService,
                private dialogService: DialogService,
                private tenantService: TenantService) {
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
        let modalRef = this.dialogService.open(CreateTenantComponent, {
            header: "Create Tenant",
            width: "50vh",
            modal: true
        });
        const tenant = await firstValueFrom(modalRef.onClose);
        modalRef.destroy();
        console.log(tenant);
        await this.ngOnInit();
    }
}
