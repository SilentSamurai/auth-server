import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {lastValueFrom} from "rxjs";
import {MessageService} from "primeng/api";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
    selector: 'edit-user-modal',
    templateUrl: './edit-user-modal.component.html',
    styleUrls: ['./edit-user-modal.component.css'],
})
export class EditUserModalComponent implements OnInit {
    user: any;
    form: any;

    constructor(private userService: UserService,
                public ref: DynamicDialogRef,
                public config: DynamicDialogConfig,
                private messageService: MessageService) {
    }

    ngOnInit() {
        this.user = this.config.data.user;
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
            // this.completeUpdate.emit(editedUser);
            // this.activeModal.close(editedUser);
            this.ref.close(editedUser);
        } catch (e: any) {
            console.error(e);
            this.messageService.add({severity: 'error', summary: 'Error', detail: e.error.message});
        }
    }
}
