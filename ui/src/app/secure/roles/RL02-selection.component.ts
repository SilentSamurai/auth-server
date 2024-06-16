import {Component, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {RoleService} from "../../_services/role.service";


@Component({
    selector: 'app-role-list',
    template: `
        <nav-bar></nav-bar>
        <div class="container-fluid">
            <div class="row">
                <div class="col-4">
                    <h5 class="my-2">Select Role</h5>
                    <form class="form-group g-3">

                        <label class="col-3 col-form-label control-label-required" for="Role">
                            Role:
                        </label>
                        <app-value-help-input
                            (dataProvider)="onRoleLoad($event)"
                            [(selection)]="selectedRole"
                            class="col-3"
                            idField="id"
                            labelField="name"
                            multi="false"
                            name="Role">

                            <app-fb-col name="name" label="Name"></app-fb-col>
                            <app-fb-col name="tenant" label="Tenant"></app-fb-col>

                            <app-vh-col name="name" label="Name"></app-vh-col>
                            <app-vh-col name="tenant/name" label="Tenant"></app-vh-col>

                            <ng-template #vh_body let-row>
                                <td>{{ row.name }}</td>
                                <td>{{ row.tenant.name }}</td>
                            </ng-template>

                        </app-value-help-input>


                        <div class=" d-grid gap-2 py-3 d-flex justify-content-end ">
                            <button (click)="continue()" class="btn btn-primary btn-block btn-sm" id="login-btn">
                                Continue
                            </button>
                        </div>
                    </form>

                </div>

            </div>
        </div>
    `,
    styles: [`
    `]
})
export class RL02SelectionComponent implements OnInit {

    roles = [];
    tenants: [] = [];
    selectedTenant: any[] = [];
    selectedRole: any[] = [];

    constructor(private roleService: RoleService,
                private tenantService: TenantService,
                private route: ActivatedRoute,
                private router: Router,
                private authDefaultService: AuthDefaultService,
                private messageService: MessageService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.authDefaultService.setTitle("RL02: Select Role");
    }

    async continue() {
        console.log({
            'roles': this.selectedRole
        });
        if (this.selectedRole.length > 0) {
            await this.router.navigate([
                '/RL02', this.selectedRole[0].tenant.id, this.selectedRole[0].name]);
        }
    }

    async onRoleLoad(event: TableAsyncLoadEvent) {
        let roles = await this.roleService.queryRoles({
            pageNo: event.pageNo,
            where: event.filters.filter(item => item.value != null && item.value.length > 0),
            expand: ["Tenants"]
        });
        this.roles = roles.data;
        event.update(this.roles);
    }

}
