import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-update-tenant',
    templateUrl: './update-tenant.component.html',
    styleUrls: ['./update-tenant.component.css']
})
export class UpdateTenantComponent implements OnInit {

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
