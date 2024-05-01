import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {EditUserModalComponent} from "../edit-user-modal/edit-user-modal.component";
import {UserService} from "../../../_services/user.service";
import {lastValueFrom} from "rxjs";

@Component({
    selector: 'tenant-details',
    templateUrl: './user-details.component.html',
    styleUrls: []
})
export class UserDetailsComponent implements OnInit {

    user_email: string = "";
    user: any = {
        name: "",
        createdAt: ""
    };
    tenants: any = [];

    constructor(private userService: UserService,
                private actRoute: ActivatedRoute,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.user_email = this.actRoute.snapshot.params['email'];
        console.log(this.user_email)
        this.user = await lastValueFrom(this.userService.getUser(this.user_email));
        this.tenants = await lastValueFrom(this.userService.getUserTenants(this.user_email))
    }

    openUpdateModal() {
        const modalRef = this.modalService.open(EditUserModalComponent);
        modalRef.componentInstance.user = this.user;
    }

}
