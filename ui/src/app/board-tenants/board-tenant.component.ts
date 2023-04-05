import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';

@Component({
    selector: 'app-board-tenants',
    templateUrl: './board-tenant.component.html',
    styleUrls: ['./board-tenant.component.css']
})
export class BoardTenantComponent implements OnInit {

    tenants: any[] = [];

    constructor(private userService: UserService) {
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
    }

    openUpdateModal(tenant: any) {
    }

    openDeleteModal(tenant: any) {
    }
}
