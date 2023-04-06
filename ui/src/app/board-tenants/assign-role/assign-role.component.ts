import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-tenant-assign-role',
    templateUrl: './assign-role.component.html',
    styleUrls: ['./assign-role.component.css']
})
export class AssignRoleComponent implements OnInit {

    selectedRoles = [];

    roles = [
        {name: "Admin", id: "admin"},
        {name: "User", id: "user"}
    ]

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    onSubmit() {

    }
}
