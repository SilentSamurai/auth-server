import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {ValueHelpComponent} from "../../component/value-help/value-help.component";

@Component({
    selector: 'app-role-list',
    templateUrl: './role-list.component.html',
    styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {
    email: any | null = null;
    tenantId: any | null = null;

    roles = [];

    constructor(private userService: UserService,
                private route: ActivatedRoute,
                private modalService: NgbModal) {
    }

    ngOnInit(): void {
        let params = this.route.snapshot.queryParamMap;
        if (params.has('email')) {
            this.email = params.get('email')
        }
        if (params.has('tenantId')) {
            this.tenantId = params.get('tenantId')
        }
    }

    async openUserValueHelp() {
        const modalRef = this.modalService.open(ValueHelpComponent, {size: 'lg', backdrop: 'static'});
        const user = await modalRef.result;
        console.log(user);
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
}
