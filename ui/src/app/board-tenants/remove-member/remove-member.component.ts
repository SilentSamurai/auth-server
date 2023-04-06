import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'delete-tenant-modal',
    templateUrl: './remove-member.component.html',
    styleUrls: ['./remove-member.component.css']
})
export class RemoveMemberComponent implements OnInit {
    @Input() member: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.member);
    }

    onSubmit() {
        this.passEntry.emit(this.member);
        this.activeModal.close(this.member);
    }
}
