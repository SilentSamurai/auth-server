import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";

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
        password: null
    };

    constructor(private userService: UserService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
    }

    async onSubmit() {
        try {
            let createdUser = await this.userService.createUser(this.form.name, this.form.email, this.form.password);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'User Created'});
            this.passEntry.emit(createdUser);
            this.activeModal.close(createdUser);
        } catch (e: any) {
            console.error(e);
            this.messageService.add({severity: 'error', summary: 'Error', detail: e.error.message});
        }
    }
}

