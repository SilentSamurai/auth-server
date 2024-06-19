import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";


@Component({
    selector: 'app-TNRL01-SEL',
    template: `
        <nav-bar></nav-bar>
        <div class="container-fluid">
            <div class="row">
                <div class="h5 py-2">
                    Select Tenant & User:
                </div>
                <div class="col-4">
                    <form class="form-group g-3">

                        <label class="col-3 col-form-label" for="Tenant">
                            Tenant:
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

                        <label class="col-3 col-form-label" for="Email">
                            Email:
                        </label>
                        <app-value-help-input
                            (dataProvider)="userDataProvider($event)"
                            [(selection)]="selectedUser"
                            class="col-3"
                            idField="email"
                            labelField="email"
                            multi="false"
                            name="Email">

                            <app-fb-col name="email" label="Email"></app-fb-col>
                            <app-fb-col name="name" label="Name"></app-fb-col>
                            <app-fb-col name="tenants/domain" label="Tenant Domain"></app-fb-col>

                            <app-vh-col name="name" label="Name"></app-vh-col>
                            <app-vh-col name="email" label="Email"></app-vh-col>

                            <ng-template #vh_body let-row>
                                <td>{{ row.name }} {{ row.surname }}</td>
                                <td>
                                    {{ row.email }}
                                </td>
                            </ng-template>

                        </app-value-help-input>


                        <div class=" d-grid gap-2 py-3 d-flex justify-content-end ">
                            <button (click)="continue()" class="btn btn-primary btn-block btn-sm"
                                    id="TNRL01-SEL-CONT-BTN">
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
export class TNRL01SelectionComponent implements OnInit {

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
        this.authDefaultService.setTitle("TNRL01: Manage Role Assignments of Tenant");
    }

    async continue() {
        console.log({
            'users': this.selectedUser,
            'tenant': this.selectedTenant
        });
        if (this.selectedTenant.length > 0 && this.selectedUser.length > 0) {
            const isMem = await this.isMember();
            if (isMem) {
                await this.router.navigate([
                    '/TNRL01',
                    this.selectedTenant[0].id, this.selectedUser[0].email])
            }
        }
    }

    async isMember() {
        const email = this.selectedUser[0].email;
        const tenantId = this.selectedTenant[0].id;
        try {
            await this.tenantService.getMemberDetails(tenantId, email);
        } catch (exception: any) {
            this.messageService.add({severity: 'error', summary: 'Failed', detail: exception.error.message});
            return false;
        }
        return true;
    }

    async userDataProvider(event: TableAsyncLoadEvent) {
        let response = await this.userService.queryUser({
            pageNo: event.pageNo,
            where: event.filters.filter(item => item.value != null && item.value.length > 0),
        });
        this.users = response.data;
        event.update(this.users);
    }

    async onTenantLoad(event: TableAsyncLoadEvent) {
        let response = await this.tenantService.queryTenant({
            pageNo: event.pageNo,
            where: event.filters.filter(f => f.value != null && f.value.length > 0),
        });
        this.tenants = response.data;
        event.update(this.tenants);
    }

}
