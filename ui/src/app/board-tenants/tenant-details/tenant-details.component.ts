import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AddMemberComponent} from "../add-member/add-member.component";
import {UpdateTenantComponent} from "../update-tenant/update-tenant.component";
import {AddRoleComponent} from "../add-role/add-role.component";
import {AssignRoleComponent} from "../assign-role/assign-role.component";
import {RemoveMemberComponent} from "../remove-member/remove-member.component";

@Component({
    selector: 'tenant-details',
    templateUrl: './tenant-details.component.html',
    styleUrls: ['./tenant-details.component.css']
})
export class TenantDetailsComponent implements OnInit {

    tenant_id: string = "";
    tenant = {
        id: "abcd",
        name: "tenant-1",
        subdomain: "asdasd.asd.asd",
        roles: [
            "Admin",
            "User"
        ]
    };
    members = [
        {
            name: "apple pie",
            email: "testmaim@asd.com",
            username: "asdasd",
            roles: [
                "Admin",
                "User"
            ]
        }
    ]

    constructor(private actRoute: ActivatedRoute, private modalService: NgbModal) {
    }

    ngOnInit(): void {
        this.tenant_id = this.actRoute.snapshot.params['tenantId'];
        console.log(this.tenant_id)
    }

    onUpdateTenant() {
        const modalRef = this.modalService.open(UpdateTenantComponent);
        modalRef.componentInstance.form = this.tenant;
    }

    onAddMember() {
        const modalRef = this.modalService.open(AddMemberComponent);
    }

    onAddRole() {
        const modalRef = this.modalService.open(AddRoleComponent);
    }

    onAssignRole(user: any) {
        const modalRef = this.modalService.open(AssignRoleComponent);
    }

    removeMember(user: any) {
        const modalRef = this.modalService.open(RemoveMemberComponent);
    }
}
