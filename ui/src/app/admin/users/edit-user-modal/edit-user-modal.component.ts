import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UserService} from '../../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {lastValueFrom} from "rxjs";
import {MessageService} from "primeng/api";

@Component({
    selector: 'create-user-modal',
    templateUrl: './edit-user-modal.component.html',
    styleUrls: ['./edit-user-modal.component.css']
})
export class EditUserModalComponent implements OnInit {
    @Input() user: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();
    form: any;

    constructor(private userService: UserService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        this.form = {
            name: this.user.name,
            email: this.user.email,
            password: null
        }
        console.log(this.user);
    }

    async onSubmit() {
        try {
            let editedUser: any = this.userService.editUser(
                this.user.id,
                this.user.name === this.form.name ? null : this.form.name,
                this.user.email === this.form.email ? null : this.form.email,
                this.form.password
            );
            editedUser = await lastValueFrom(editedUser);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'User Updated'});
            this.passEntry.emit(editedUser);
            this.activeModal.close(editedUser);
        } catch (e: any) {
            console.error(e);
            this.messageService.add({severity: 'error', summary: 'Error', detail: e.error.message});
        }
    }
}
