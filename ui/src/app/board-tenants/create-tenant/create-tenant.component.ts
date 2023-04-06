import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-create-tenant',
    templateUrl: './create-tenant.component.html',
    styleUrls: ['./create-tenant.component.css']
})
export class CreateTenantComponent implements OnInit {

    form = {
        name: null,
        subdomain: null
    }

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    onSubmit() {

    }
}
