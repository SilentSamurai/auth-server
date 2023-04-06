import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateTenantComponent} from "./create-tenant/create-tenant.component";
import {UpdateTenantComponent} from "./update-tenant/update-tenant.component";
import {DeleteTenantComponent} from "./delete-tenant/delete-tenant.component";

@Component({
    selector: 'app-board-tenants',
    templateUrl: './board-tenant.component.html',
    styleUrls: ['./board-tenant.component.css']
})
export class BoardTenantComponent implements OnInit {

    tenants: any[] = [];

    constructor(private userService: UserService, private modalService: NgbModal) {
    }

    ngOnInit(): void {
        this.tenants = [{
            id: "asjdbjkas-asndjans-ajsbn",
            name: "tenant-1",
            subdomain: "subdomain",
        }, {
            id: "asjdbjkas-asndjans-ajsbn",
            name: "tenant-1",
            subdomain: "subdomain",
        }]
    }

    openCreateModal() {
        const modalRef = this.modalService.open(CreateTenantComponent);
    }

    openUpdateModal(tenant: any) {
        const modalRef = this.modalService.open(UpdateTenantComponent);
        modalRef.componentInstance.form = tenant;
    }

    openDeleteModal(tenant: any) {
        const modalRef = this.modalService.open(DeleteTenantComponent);
        modalRef.componentInstance.tenant = tenant;
    }
}
