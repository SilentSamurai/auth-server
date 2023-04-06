import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'delete-tenant-modal',
    templateUrl: './delete-tenant.component.html',
    styleUrls: ['./delete-tenant.component.css']
})
export class DeleteTenantComponent implements OnInit {
    @Input() tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.tenant);
    }

    onSubmit() {
        this.passEntry.emit(this.tenant);
        this.activeModal.close(this.tenant);
    }
}
