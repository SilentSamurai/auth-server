import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {lastValueFrom} from "rxjs";

@Component({
    selector: 'create-user-modal',
    templateUrl: './delete-user-modal.component.html',
    styleUrls: ['./delete-user-modal.component.css']
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
