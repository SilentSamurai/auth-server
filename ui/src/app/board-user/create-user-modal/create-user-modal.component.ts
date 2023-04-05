import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'create-user-modal',
    templateUrl: './create-user-modal.component.html',
    styleUrls: ['./create-user-modal.component.css']
})
export class CreateUserModalComponent implements OnInit {
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form: any = {
        email: null,
        name: null,
        username: null
    };

    constructor(private userService: UserService, public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.form);
    }

    onSubmit() {
        this.passEntry.emit(this.form);
        this.activeModal.close(this.form);
    }
}
