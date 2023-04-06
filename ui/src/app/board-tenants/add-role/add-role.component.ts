import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-create-tenant',
    templateUrl: './add-role.component.html',
    styleUrls: ['./add-role.component.css']
})
export class AddRoleComponent implements OnInit {

    form = {
        name: null
    }

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    onSubmit() {

    }
}
