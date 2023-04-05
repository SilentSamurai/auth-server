import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'create-user-modal',
    templateUrl: './delete-user-modal.component.html',
    styleUrls: ['./delete-user-modal.component.css']
})
export class DeleteUserModalComponent implements OnInit {
    @Input() user: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(private userService: UserService, public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.user);
    }

    onSubmit() {
        this.passEntry.emit(this.user);
        this.activeModal.close(this.user);
    }
}
