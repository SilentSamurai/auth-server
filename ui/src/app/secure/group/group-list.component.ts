import {Component, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AppTableComponent, TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {Filter} from "../../component/filter-bar/filter-bar.component";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {ActivatedRoute, Router} from "@angular/router";
import {GroupService} from "../../_services/group.service";
import {CreateGroupComponent} from "./create-group.component";

@Component({
    selector: 'app-board-user',
    template: `
        <nav-bar></nav-bar>
        <div class="container-fluid">
            <div class="row">
                <div class="col-xl-12">
                    <div class="card my-2">
                        <div class="card-header bg-dark-subtle">
                            <div class="d-flex justify-content-between">
                                <span class="h4">Groups</span>
                                <button (click)="openCreateModal()"
                                        class="btn btn-success btn-sm"
                                        type="button">
                                    <i class="fa fa-solid fa-plus me-2"></i>Create Group
                                </button>
                            </div>
                            <app-fb (onFilter)="onFilter($event)">
                                <app-fb-col label="Name" name="name"></app-fb-col>
                                <app-fb-col label="Tenant Id" name="tenantId"></app-fb-col>
                            </app-fb>
                        </div>
                        <div class="card-body p-0">
                            <app-table
                                (onLoad)="lazyLoad($event)"
                                idField="email"
                                isFilterAsync="true"
                                multi="true"
                                scrollHeight="75vh">

                                <app-table-col label="Name" name="name"></app-table-col>
                                <app-table-col label="Tenant" name="tenantId"></app-table-col>
                                <app-table-col label="Create At" name="createdAt"></app-table-col>
                                <app-table-col label="Action" name="action"></app-table-col>

                                <ng-template #table_body let-group>
                                    <td>
                                        <a [routerLink]="['/GP02/', group.id]"
                                           href="javascript:void(0)">{{ group.name }}</a>
                                    </td>
                                    <td>
                                        <a [routerLink]="['/tenant/', group.tenantId]"
                                           href="javascript:void(0)">{{ group.tenantId }}</a>
                                    </td>
                                    <td><span class="p-column-title">Created At</span>{{ group.createdAt | date }}</td>
                                    <td class="d-flex ">
                                        <button (click)="openUpdateModal(group)" class="btn " type="button">
                                            <i class="fa fa-edit"></i>
                                        </button>
                                        <button (click)="openDeleteModal(group)" class="btn " type="button">
                                            <i class="fa fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </ng-template>
                            </app-table>
                        </div>
                    </div>
                </div>
                <div class="">
                </div>
            </div>
        </div>

    `,
    styles: ['']
})
export class GroupListComponent implements OnInit {

    @ViewChild(AppTableComponent)
    table!: AppTableComponent;

    tenantId: string = "";

    groups: any = [];

    constructor(private userService: UserService,
                private authDefaultService: AuthDefaultService,
                private groupService: GroupService,
                private route: ActivatedRoute,
                private router: Router,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        // this.users = await this.userService.queryUser({});
        this.authDefaultService.setTitle("Manage Groups");
        // this.tenantId = this.route.snapshot.params['tenantId'];
    }

    async openCreateModal() {
        const modalRef = this.modalService.open(CreateGroupComponent);
        const user = await modalRef.result;
        console.log(user);
        this.ngOnInit();
    }

    async openUpdateModal(user: any) {
        // const modalRef = this.modalService.open(EditUserModalComponent);
        // modalRef.componentInstance.user = user;
        // const editedUser = await modalRef.result;
        // console.log(editedUser);
        this.ngOnInit();
    }

    async openDeleteModal(user: any) {
        // const modalRef = this.modalService.open(DeleteUserModalComponent);
        // modalRef.componentInstance.user = user;
        // const deletedUser = await modalRef.result;
        // console.log(deletedUser);
        this.ngOnInit();
    }

    async lazyLoad($event: TableAsyncLoadEvent) {
        // let filters = $event.filters.filter(item => item.value != null && item.value.length > 0);
        // filters.push({
        //     name: "tenantId",
        //     value: this.tenantId,
        //     operator: "equals"
        // })
        this.groups = await this.groupService.queryGroup(this.tenantId, {
            pageNo: $event.pageNo,
            where: $event.filters.filter(item => item.value != null && item.value.length > 0),
        });
        $event.update(this.groups.data);
    }

    onFilter(filters: Filter[]) {
        this.table.filter(filters);
    }
}
