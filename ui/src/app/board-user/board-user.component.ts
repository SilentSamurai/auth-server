import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateUserModalComponent} from "./create-user-modal/create-user-modal.component";
import {EditUserModalComponent} from "./edit-user-modal/edit-user-modal.component";
import {DeleteUserModalComponent} from "./delete-user-modal/delete-user-modal.component";

@Component({
    selector: 'app-board-user',
    templateUrl: './board-user.component.html',
    styleUrls: ['./board-user.component.css']
})
export class BoardUserComponent implements OnInit {
    users: any[] = [];

    constructor(private userService: UserService, private modalService: NgbModal) {
    }

    ngOnInit(): void {
        this.userService.getAllUsers().subscribe({
            next: data => {
                this.users = data;
            },
            error: err => {
                this.users = [];
            }
        });
    }

    openCreateModal() {
        const modalRef = this.modalService.open(CreateUserModalComponent);
    }

    openUpdateModal(user: any) {
        const modalRef = this.modalService.open(EditUserModalComponent);
        modalRef.componentInstance.user = user;
    }

    openDeleteModal(user: any) {
        const modalRef = this.modalService.open(DeleteUserModalComponent);
        modalRef.componentInstance.user = user;
    }
}
