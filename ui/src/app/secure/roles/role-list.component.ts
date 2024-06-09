import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {lastValueFrom} from "rxjs";
import {VHAsyncLoadEvent} from "../../component/value-help-input/value-help-input.component";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";


@Component({
    selector: 'app-role-list',
    templateUrl: './role-list.component.html',
    styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {

    tenantId: string = '';
    email: string = '';
    member: any = {
        roles: []
    };
    user: any;
    tenant: any;
    loading = true;
    tenantRoles: any;
    selectedRoles: any[] = [];

    constructor(private userService: UserService,
                private tenantService: TenantService,
                private route: ActivatedRoute,
                private router: Router,
                private messageService: MessageService,
                private authDefaultService: AuthDefaultService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.authDefaultService.setTitle("Manage Role Assignments");

        this.tenantId = this.route.snapshot.params['tenantId'];
        this.email = this.route.snapshot.params['email'];

        // let params = this.route.snapshot.queryParamMap;
        // if (!params.has('email') || !params.has('tenantId')) {
        //     await this.router.navigate(['/role-sel']);
        // }
        // this.email = params.get('email') as string;
        // this.tenantId = params.get('tenantId') as string;
        if (!this.email || !this.tenantId) {
            await this.router.navigate(['/RL02-SEL']);
        }

        this.tenant = await this.tenantService.getTenantDetails(this.tenantId);
        this.user = await lastValueFrom(this.userService.getUser(this.email));
        try {

            await this.loadTable();
            this.tenantRoles = this.tenant.roles;
            this.loading = false;

        } catch (exception: any) {
            console.log(exception);
            this.messageService.add({severity: 'error', summary: 'Failed', detail: exception.error.message});
        }

    }

    async loadTable() {
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

    async onAddRole() {
        await this.tenantService.assignRole(this.selectedRoles, this.tenantId, this.email);
        await this.loadTable();
        this.selectedRoles = [];
    }

    onRemoveRole(role: any) {

    }

    provideRoles($event: VHAsyncLoadEvent) {
        $event.update(this.tenantRoles, []);
    }

    onAddRoleSelection(selected: any[]) {

    }
}
