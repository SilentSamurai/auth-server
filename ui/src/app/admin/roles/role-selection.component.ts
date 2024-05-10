import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {lastValueFrom} from "rxjs";
import {TenantService} from "../../_services/tenant.service";
import {TableAsyncLoadEvent} from "../../component/table/table.component";


@Component({
    selector: 'app-role-list',
    template: `
        <admin-nav-bar></admin-nav-bar>
        <div class="container-fluid">
            <div class="row">
                <div class="h4 py-2">
                    Manage Roles
                </div>
                <div class="col-4">
                    <form class="form-group g-3">

                        <label class="col-3 col-form-label" for="Email">
                            Email
                        </label>
                        <app-value-help-input
                            (dataProvider)="userDataProvider($event)"
                            [(selection)]="selectedUser"
                            class="col-3"
                            idField="email"
                            labelField="email"
                            multi="true"
                            name="Email">

                            <app-vh-col name="name" label="Name"></app-vh-col>
                            <app-vh-col name="email" label="Email"></app-vh-col>

                            <ng-template #vh_body let-row>
                                <td>{{ row.name }} {{ row.surname }}</td>
                                <td>
                                    {{ row.email }}
                                </td>
                            </ng-template>

                        </app-value-help-input>


                        <label class="col-3 col-form-label" for="Tenant">
                            Tenant
                        </label>

                        <app-value-help-input
                            (dataProvider)="onTenantLoad($event)"
                            [(selection)]="selectedTenant"
                            class="col-3"
                            idField="id"
                            labelField="name"
                            name="Tenant">

                            <app-vh-col name="name" label="Name"></app-vh-col>
                            <app-vh-col name="domain" label="Domain"></app-vh-col>


                            <ng-template #vh_body let-row>
                                <td>{{ row.name }}</td>
                                <td>
                                    {{ row.domain }}
                                </td>
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
export class RoleSelectionComponent implements OnInit {

    tenantId: any | null = null;
    email: string | null = '';
    roles = [];
    users: any[] = [];
    tenants: [] = [];
    selectedTenant: any[] = [];
    selectedUser: any[] = [];

    constructor(private userService: UserService,
                private tenantService: TenantService,
                private route: ActivatedRoute,
                private router: Router,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {

    }

    async continue() {
        console.log({
            'users': this.selectedUser,
            'tenant': this.selectedTenant
        });
        if (this.selectedTenant.length > 0 && this.selectedUser.length > 0) {
            await this.router.navigate(['/admin', 'roles'], {
                queryParams: {
                    email: this.selectedUser[0].email,
                    tenantId: this.selectedTenant[0].id
                }
            })
        }
    }

    async userDataProvider($event: TableAsyncLoadEvent) {
        this.users = await lastValueFrom(this.userService.getAllUsers());
        $event.update(this.users);
    }

    async onTenantLoad(event: TableAsyncLoadEvent) {
        this.tenants = await lastValueFrom(this.tenantService.getAllTenants());
        event.update(this.tenants);
    }

}