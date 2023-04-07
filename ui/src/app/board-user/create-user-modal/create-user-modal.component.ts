import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {lastValueFrom} from "rxjs";

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
            let createdUser = this.userService.createUser(this.form.name, this.form.email, this.form.password);
            const user = await lastValueFrom(createdUser);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'User Created'});
            this.passEntry.emit(user);
            this.activeModal.close(user);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'User Creation Failed'});
        }
    }
}

