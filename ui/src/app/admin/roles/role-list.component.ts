import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";


@Component({
    selector: 'app-role-list',
    templateUrl: './role-list.component.html',
    styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {

    tenantId: any | null = null;
    email: string | null = '';
    member: any;
    user: any;
    tenant: any;

    constructor(private userService: UserService,
                private tenantService: TenantService,
                private route: ActivatedRoute,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        let params = this.route.snapshot.queryParamMap;
        if (params.has('email')) {
            this.email = params.get('email')
        }
        if (params.has('tenantId')) {
            this.tenantId = params.get('tenantId')
        }

        if (this.tenantId && this.email) {
            this.member = await this.tenantService.getMemberDetails(this.tenantId, this.email);
        }

    }

    openCreateModal() {

    }

    openUpdateModal(user: any) {

    }

    openDeleteModal(user: any) {

    }

    onAddScope() {

    }

    onRemoveScope(scope: any) {

    }
}
