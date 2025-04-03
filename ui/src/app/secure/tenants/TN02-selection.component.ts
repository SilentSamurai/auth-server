import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {DataModel} from "../../component/model/DataModel";


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

                        <app-value-help-input id="select-tenant"
                                              [dataModel]="tenantsDM"
                                              [(selection)]="selectedTenant"
                                              class="col-3"
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
                            <button (click)="continue()" class="btn btn-primary btn-block btn-sm"
                                    id="TN02_SEL_CONT_BTN">
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

    tenants: [] = [];
    selectedTenant: any[] = [];
    tenantsDM!: DataModel;

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
        this.tenantsDM = this.tenantService.createDataModel([]);
    }

    async continue() {
        console.log({
            'tenant': this.selectedTenant
        });
        if (this.selectedTenant.length > 0) {
            await this.router.navigate(['/TN02', this.selectedTenant[0].id])
        }
    }


    // async onTenantLoad(event: TableAsyncLoadEvent) {
    //     let response = await this.tenantService.queryTenant({
    //         pageNo: event.pageNo,
    //         where: event.filters.filter(item => item.value != null && item.value.length > 0)
    //     });
    //     this.tenants = response.data;
    //     event.update(this.tenants, response.hasNextPage);
    // }

}
