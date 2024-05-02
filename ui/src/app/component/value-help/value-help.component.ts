import {Component, OnInit} from '@angular/core';

import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {UserService} from "../../_services/user.service";
import {lastValueFrom} from "rxjs";

@Component({
    selector: 'app-value-help',
    templateUrl: './value-help.component.html',
    styleUrls: ['./value-help.component.css']
})
export class ValueHelpComponent implements OnInit {

    data = [];
    multi: boolean = true;
    selectedItem: any = [];


    constructor(private userService: UserService,
                private route: ActivatedRoute,
                private activeModal: NgbActiveModal,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.data = await lastValueFrom(this.userService.getAllUsers())
        console.log("multi", this.multi)
    }

    async openCreateModal() {
        // const modalRef = this.modalService.open(CreateUserModalComponent);
        // const user = await modalRef.result;
        // console.log(user);
        // this.ngOnInit();
    }

    async openUpdateModal(user: any) {
        // const modalRef = this.modalService.open(EditUserModalComponent);
        // modalRef.componentInstance.user = user;
        // const editedUser = await modalRef.result;
        // console.log(editedUser);
        // this.ngOnInit();
    }

    async openDeleteModal(user: any) {
        // const modalRef = this.modalService.open(DeleteUserModalComponent);
        // modalRef.componentInstance.user = user;
        // const deletedUser = await modalRef.result;
        // console.log(deletedUser);
        // this.ngOnInit();
    }

    Confirm() {
        this.activeModal.close(this.selectedItem);
    }

    closeValueHelp() {
        this.activeModal.dismiss('user dismissed');
    }
}
