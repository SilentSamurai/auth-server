import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {MessageService} from "primeng/api";

@Component({
    selector: 'app-board-user',
    templateUrl: './board-user.component.html',
    styleUrls: ['./board-user.component.scss']
})
export class BoardUserComponent implements OnInit {
    users: any[] = [];
    createDialog = false;

    constructor(private userService: UserService,
                private messageService: MessageService,) {
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

    async openCreateModal() {
        this.createDialog = true;
    }

    async completeCreate($event: any) {
        this.createDialog = false;
        this.ngOnInit();
    }

    // async openUpdateModal(user: any) {
    //     // const modalRef = this.modalService.open(EditUserModalComponent);
    //     // modalRef.componentInstance.user = user;
    //     // const editedUser = await modalRef.result;
    //     // console.log(editedUser);
    //     this.ngOnInit();
    // }
    //
    // async openDeleteModal(user: any) {
    //     // const modalRef = this.modalService.open(DeleteUserModalComponent);
    //     // modalRef.componentInstance.user = user;
    //     // const deletedUser = await modalRef.result;
    //     // console.log(deletedUser);
    //     this.ngOnInit();
    // }

}
