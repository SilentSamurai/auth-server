import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {MessageService} from "primeng/api";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {GroupService} from "../../_services/group.service";


@Component({
    selector: 'app-group-sel',
    template: `
        <nav-bar></nav-bar>
        <div class="container-fluid">
            <div class="row">
                <div class="h4 py-2">
                    Manage Roles
                </div>
                <div class="col-4">
                    <form class="form-group g-3">

                        <label class="col-3 col-form-label control-label-required" for="Group">
                            Group
                        </label>
                        <app-value-help-input
                            (dataProvider)="groupDataProvider($event)"
                            [(selection)]="selectedGroup"
                            class="col-3"
                            idField="id"
                            labelField="name"
                            multi="false"
                            name="Group">

                            <app-fb-col name="name" label="Name"></app-fb-col>
                            <app-fb-col name="tenant/name" label="Tenant"></app-fb-col>

                            <app-vh-col name="name" label="Name"></app-vh-col>
                            <app-vh-col name="tenant" label="Tenant"></app-vh-col>

                            <ng-template #vh_body let-row>
                                <td>{{ row.name }}</td>
                                <td>
                                    {{ row.tenant.name }}
                                </td>
                            </ng-template>

                        </app-value-help-input>


                        <div class=" d-grid gap-2 py-3 d-flex justify-content-end ">
                            <button (click)="continue()" class="btn btn-primary btn-block btn-sm"
                                    id="GP02-SEL-CONT-BTN">
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
export class GP02SelectionComponent implements OnInit {

    groups: any[] = [];
    selectedGroup: any[] = [];

    constructor(private userService: UserService,
                private tenantService: TenantService,
                private groupService: GroupService,
                private route: ActivatedRoute,
                private router: Router,
                private authDefaultService: AuthDefaultService,
                private messageService: MessageService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.authDefaultService.setTitle("GP02: Select Group");

    }

    async continue() {
        console.log({
            'group': this.selectedGroup
        });
        if (this.selectedGroup.length > 0) {
            await this.router.navigate([
                '/GP02', this.selectedGroup[0].id
            ])
        } else {
            this.messageService.add({severity: 'error', summary: 'Error', detail: "Select the group"})
        }
    }

    async groupDataProvider(event: TableAsyncLoadEvent) {
        if (event.pageNo == 0) {
            let response = await this.groupService.queryGroup({
                pageNo: event.pageNo,
                where: event.filters.filter(f => f.value != null && f.value.length > 0),
                expand: ["Tenants"]
            });
            this.groups = response.data;
            event.update(this.groups);
        }
    }

}
