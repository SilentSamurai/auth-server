import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'app-board-tenants',
    templateUrl: './show-tenant.component.html',
    styleUrls: ['./show-tenant.component.css']
})
export class ShowTenantComponent implements OnInit {

    tenant_id: string = "";
    tenant = {
        id: "abcd",
        name: "tenant-1",
        subdomain: "asdasd.asd.asd"
    };
    members = [
        {
            name: "apple pie",
            email: "testmaim@asd.com",
            username: "asdasd"
        }
    ]

    constructor(private actRoute: ActivatedRoute) {
    }

    ngOnInit(): void {
        this.tenant_id = this.actRoute.snapshot.params['tenantId'];
        console.log(this.tenant_id)
    }

}
