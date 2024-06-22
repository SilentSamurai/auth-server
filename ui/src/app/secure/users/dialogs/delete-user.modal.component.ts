import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UserService} from '../../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {lastValueFrom} from "rxjs";

@Component({
    selector: 'create-user-modal',
    template: `
        <app-standard-dialog title="Delete User">
            <app-dialog-tab>
                <p>Are you sure, you want to delete user <strong>{{ user.name }}</strong> ?</p>
            </app-dialog-tab>
            <app-dialog-footer>
                <button (click)="activeModal.close('Cross click')" class="btn btn-secondary" type="button">
                    No
                </button>
                <button (click)="onYes()" class="btn btn-primary" type="button">
                    Yes
                </button>
            </app-dialog-footer>
        </app-standard-dialog>
    `,
    styles: ['']
})
export class DeleteUserModalComponent implements OnInit {
    @Input() user: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(private userService: UserService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.user);
    }

    async onYes() {
        try {
            let deletedUser: any = this.userService.deleteUser(this.user.id);
            deletedUser = await lastValueFrom(deletedUser);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'User Deleted'});
            this.passEntry.emit(deletedUser);
            this.activeModal.close(deletedUser);
        } catch (e: any) {
            console.error(e);
            this.messageService.add({severity: 'error', summary: 'Error', detail: e.error.message});
        }

    }
}
