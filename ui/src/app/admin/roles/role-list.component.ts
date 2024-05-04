import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {lastValueFrom} from "rxjs";
import {TenantService} from "../../_services/tenant.service";
import {Filter} from "../../component/value-help-input/value-help-input.component";

@Component({
    selector: 'app-role-list',
    templateUrl: './role-list.component.html',
    styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {

    tenantId: any | null = null;
    email: string | null = '';
    roles = [];
    users = [];
    tenants: [] = [];
    selectedTenant: any[] = [];
    selectedUser: any[] = [];

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
    }

    continue() {
        console.log({
            'users': this.selectedUser,
            'tenant': this.selectedTenant
        });
    }

    onTenantSelection(rows: any[]) {
        this.selectedTenant = rows;
    }

    onUserSelection(rows: any[]) {
        this.selectedUser = rows;
    }

    filterUser(filter: Filter) {
        console.log(filter)
    }

    async onUserLoad(filter: Filter) {
        this.users = await lastValueFrom(this.userService.getAllUsers())
    }

    async onTenantLoad(filter: Filter) {
        this.tenants = await lastValueFrom(this.tenantService.getAllTenants())
    }

    filterTenant(filter: Filter) {
        console.log(filter)
    }
}
