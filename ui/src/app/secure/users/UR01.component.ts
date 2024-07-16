import {Component, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateUserModalComponent} from "./dialogs/create-user.modal.component";
import {EditUserModalComponent} from "./dialogs/edit-user.modal.component";
import {AppTableComponent, TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {Filter} from "../../component/filter-bar/filter-bar.component";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {ConfirmationService} from "../../component/dialogs/confirmation.service";
import {MessageService} from "primeng/api";

@Component({
    selector: 'app-board-user',
    template: `
        <nav-bar></nav-bar>
        <app-page-view>
            <app-page-view-header>
                <app-fb (onFilter)="onFilter($event)">
                    <app-fb-col label="Name" name="name"></app-fb-col>
                    <app-fb-col label="Email" name="email"></app-fb-col>
                </app-fb>
                <div class="d-flex justify-content-between">
                    <span class="h4"></span>
                    <button (click)="openCreateModal()"
                            id="CREATE_USER_DIALOG_BTN"
                            class="btn btn-success btn-sm"
                            type="button">
                        <i class="fa fa-solid fa-plus me-2"></i>Create User
                    </button>
                </div>
            </app-page-view-header>
            <app-page-view-body>
                <app-table
                    title="Users"
                    (onDataRequest)="lazyLoad($event)"
                    idField="email"
                    isFilterAsync="true"
                    multi="true"
                    scrollHeight="65vh">

                    <app-table-col label="Name" name="name"></app-table-col>
                    <app-table-col label="Email" name="email"></app-table-col>
                    <app-table-col label="Create At" name="createdAt"></app-table-col>
                    <app-table-col label="Action" name="action"></app-table-col>

                    <ng-template #table_body let-user>
                        <td><span class="p-column-title">Name</span>{{ user.name }} {{ user.surname }}</td>
                        <td>
                            <span class="p-column-title">Email</span>
                            <a [routerLink]="['/UR02/', user.id]"
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
            </app-page-view-body>
        </app-page-view>
    `,
    styles: ['']
})
export class UR01Component implements OnInit {

    @ViewChild(AppTableComponent)
    table!: AppTableComponent;

    users: any = [];

    constructor(private userService: UserService,
                private authDefaultService: AuthDefaultService,
                private confirmationService: ConfirmationService,
                private messageService: MessageService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        // this.users = await this.userService.queryUser({});
        this.authDefaultService.setTitle("UR01: Manage Users");
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
        const deletedUser = await this.confirmationService.confirm({
            message: `Are you sure you want to delete ${user.email} ?`,
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            accept: async () => {
                try {
                    let deletedUser = await this.userService.deleteUser(user.id);
                    this.messageService.add({severity: 'success', summary: 'Success', detail: 'User Deleted'});
                    return deletedUser;
                } catch (e) {
                    this.messageService.add({severity: 'error', summary: 'Error', detail: 'User Deletion Failed'});
                }
                return null;
            }
        })
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
