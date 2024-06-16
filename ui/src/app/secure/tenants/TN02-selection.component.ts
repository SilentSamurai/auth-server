import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {lastValueFrom} from "rxjs";
import {TenantService} from "../../_services/tenant.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";


@Component({
    selector: 'app-role-list',
    template: `
        <nav-bar></nav-bar>
        <div class="container-fluid">
            <div class="row">
                <div class="h4 py-2">
                    Manage Roles
                </div>
                <div class="col-4">
                    <form class="form-group g-3">

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

                            <app-fb-col name="name" label="Name"></app-fb-col>
                            <app-fb-col name="domain" label="Domain"></app-fb-col>

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
export class TN02SelectionComponent implements OnInit {

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
                private authDefaultService: AuthDefaultService,
                private messageService: MessageService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.authDefaultService.setTitle("TN02: Select Tenant");
    }

    async continue() {
        console.log({
            'tenant': this.selectedTenant
        });
        if (this.selectedTenant.length > 0) {
            await this.router.navigate(['/TN02', this.selectedTenant[0].id])
        }
    }


    async onTenantLoad(event: TableAsyncLoadEvent) {
        if (event.pageNo == 0) {
            this.tenants = await lastValueFrom(this.tenantService.getAllTenants());
            event.update(this.tenants);
        }
    }

}
