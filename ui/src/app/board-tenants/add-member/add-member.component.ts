import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-create-tenant',
    templateUrl: './add-member.component.html',
    styleUrls: ['./add-member.component.css']
})
export class AddMemberComponent implements OnInit {

    form = {
        email: null
    }

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    onSubmit() {

    }
}
