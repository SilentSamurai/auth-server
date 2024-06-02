import {Component, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateUserModalComponent} from "./create-user.modal.component";
import {EditUserModalComponent} from "./edit-user.modal.component";
import {DeleteUserModalComponent} from "./delete-user.modal.component";
import {AppTableComponent, TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {Filter} from "../../component/filter-bar/filter-bar.component";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'app-board-user',
    template: `
        <admin-nav-bar></admin-nav-bar>
        <div class="container-fluid">
            <div class="row">
                <div class="col-xl-12">
                    <div class="card my-2">
                        <div class="card-header bg-dark-subtle">
                            <div class="d-flex justify-content-between">
                                <span class="h4">Users</span>
                                <button (click)="openCreateModal()"
                                        class="btn btn-success btn-sm"
                                        type="button">
                                    <i class="fa fa-solid fa-plus me-2"></i>Create User
                                </button>
                            </div>
                            <app-fb (onFilter)="onFilter($event)">
                                <app-fb-col label="Name" name="name"></app-fb-col>
                                <app-fb-col label="Email" name="email"></app-fb-col>
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
                                <app-table-col label="Email" name="email"></app-table-col>
                                <app-table-col label="Create At" name="createdAt"></app-table-col>
                                <app-table-col label="Action" name="action"></app-table-col>

                                <ng-template #table_body let-user>
                                    <td><span class="p-column-title">Name</span>{{ user.name }} {{ user.surname }}</td>
                                    <td>
                                        <span class="p-column-title">Email</span>
                                        <a [routerLink]="['/admin/user/', user.email]"
                                           href="javascript:void(0)">{{ user.email }}</a>
                                    </td>
                                    <td><span class="p-column-title">Created At</span>{{ user.createdAt | date }}</td>
                                    <td class="d-flex ">
                                        <button (click)="openUpdateModal(user)" class="btn " type="button">
                                            <i class="fa fa-edit"></i>
                                        </button>
                                        <button (click)="openDeleteModal(user)" class="btn " type="button">
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
export class UserListComponent implements OnInit {

    @ViewChild(AppTableComponent)
    table!: AppTableComponent;

    users: any = [];

    constructor(private userService: UserService,
                private authDefaultService: AuthDefaultService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        // this.users = await this.userService.queryUser({});
        this.authDefaultService.setTitle("Manage Users");
    }

    async openCreateModal() {
        const modalRef = this.modalService.open(CreateUserModalComponent);
        const user = await modalRef.result;
        console.log(user);
        this.ngOnInit();
    }

    async openUpdateModal(user: any) {
        const modalRef = this.modalService.open(EditUserModalComponent);
        modalRef.componentInstance.user = user;
        const editedUser = await modalRef.result;
        console.log(editedUser);
        this.ngOnInit();
    }

    async openDeleteModal(user: any) {
        const modalRef = this.modalService.open(DeleteUserModalComponent);
        modalRef.componentInstance.user = user;
        const deletedUser = await modalRef.result;
        console.log(deletedUser);
        this.ngOnInit();
    }

    async lazyLoad($event: TableAsyncLoadEvent) {

        this.users = await this.userService.queryUser({
            pageNo: $event.pageNo,
            where: $event.filters.filter(item => item.value != null && item.value.length > 0),
        });
        $event.update(this.users.data);
    }

    onFilter(filters: Filter[]) {
        this.table.filter(filters);
    }
}
