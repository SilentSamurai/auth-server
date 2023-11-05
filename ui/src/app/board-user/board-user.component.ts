import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {MessageService} from "primeng/api";
import {firstValueFrom} from "rxjs";
import {DialogService} from "primeng/dynamicdialog";
import {CreateUserModalComponent} from "./create-user-modal/create-user-modal.component";

@Component({
    selector: 'app-board-user',
    templateUrl: './board-user.component.html',
    styleUrls: ['./board-user.component.scss'],
    providers: [DialogService]
})
export class BoardUserComponent implements OnInit {
    users: any[] = [];
    createDialog = false;

    constructor(private userService: UserService,
                private dialogService: DialogService,
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
        let modalRef = this.dialogService.open(CreateUserModalComponent, {
            header: "Create User",
            width: "50vh",
            modal: true
        });
        const user = await firstValueFrom(modalRef.onClose);
        modalRef.destroy();
        console.log(user);
        await this.ngOnInit();
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
