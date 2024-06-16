import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UserService} from '../../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {lastValueFrom} from "rxjs";

@Component({
    selector: 'create-user-modal',
    template: `
        <div class="modal-header">
            <h4 class="modal-title" id="modal-basic-title">Delete User</h4>
            <button (click)="activeModal.close('Cross click')"
                    aria-label="Close"
                    class="btn-sm btn "
                    type="button">
        <span aria-hidden="true">
            <i class="fa fa-icons fa-close"></i>
        </span>
            </button>
        </div>
        <div class="modal-body">
            <p>Are you sure, you want to delete user <strong>{{ user.name }}</strong> ?</p>
            <div class="align-items-end">
                <button (click)="activeModal.close('Cross click')" class="btn btn-secondary btn-md" type="button">No
                </button>
                <button (click)="onYes()" class="btn btn-primary btn-md m-2" type="button">Yes</button>
            </div>
        </div>
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
