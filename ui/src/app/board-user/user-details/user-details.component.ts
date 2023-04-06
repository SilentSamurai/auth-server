import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {EditUserModalComponent} from "../edit-user-modal/edit-user-modal.component";

@Component({
    selector: 'tenant-details',
    templateUrl: './user-details.component.html',
    styleUrls: []
})
export class UserDetailsComponent implements OnInit {

    user_email: string = "";
    user = {
        name: "apple pie",
        email: "testmaim@asd.com",
        username: "asdasd"
    };
    tenants = [
        {
            id: "asdasd-asdasd-asd",
            name: "tenant-1",
            subdomain: "asd.asd",
            roles: [
                "admin",
                "user"
            ]
        }
    ]

    constructor(private actRoute: ActivatedRoute, private modalService: NgbModal) {
    }

    ngOnInit(): void {
        this.user_email = this.actRoute.snapshot.params['email'];
        console.log(this.user_email)
    }

    openUpdateModal() {
        const modalRef = this.modalService.open(EditUserModalComponent);
        modalRef.componentInstance.user = this.user;
    }

}
