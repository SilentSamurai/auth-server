import {Component, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateUserModalComponent} from "./create-user-modal/create-user-modal.component";
import {EditUserModalComponent} from "./edit-user-modal/edit-user-modal.component";
import {DeleteUserModalComponent} from "./delete-user-modal/delete-user-modal.component";
import {AppTableComponent, TableAsyncLoadEvent} from "../../component/table/app-table.component";
import {Filter} from "../../component/filter-bar/filter-bar.component";

@Component({
    selector: 'app-board-user',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

    @ViewChild(AppTableComponent)
    table!: AppTableComponent;

    users: any = [];

    constructor(private userService: UserService, private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        // this.users = await this.userService.queryUser({});
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
