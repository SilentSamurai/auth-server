import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-board-user',
    templateUrl: './role-list.component.html',
    styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {
    users: any[] = [];

    constructor(private userService: UserService,
                private modalService: NgbModal) {
    }

    ngOnInit(): void {

    }

    // async openCreateModal() {
    //     const modalRef = this.modalService.open(CreateUserModalComponent);
    //     const user = await modalRef.result;
    //     console.log(user);
    //     this.ngOnInit();
    // }
    //
    // async openUpdateModal(user: any) {
    //     const modalRef = this.modalService.open(EditUserModalComponent);
    //     modalRef.componentInstance.user = user;
    //     const editedUser = await modalRef.result;
    //     console.log(editedUser);
    //     this.ngOnInit();
    // }
    //
    // async openDeleteModal(user: any) {
    //     const modalRef = this.modalService.open(DeleteUserModalComponent);
    //     modalRef.componentInstance.user = user;
    //     const deletedUser = await modalRef.result;
    //     console.log(deletedUser);
    //     this.ngOnInit();
    // }
}
