import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {UserService} from '../../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";

@Component({
    selector: 'create-user-modal',
    template: `
        <div class="modal-header">
            <h4 class="modal-title" id="modal-basic-title">Create User</h4>
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
            <form #createUserForm="ngForm"
                  (ngSubmit)="createUserForm.form.valid && onSubmit()"
                  name="createUserForm"
                  novalidate>
                <div class="mb-3 form-group">
                    <label class="form-label" for="create.user.name">Name</label>
                    <input #name="ngModel"
                           [(ngModel)]="form.name"
                           class="form-control"
                           id="create.user.name"
                           name="name"
                           required
                           type="text">
                    <div
                        *ngIf="name.errors && createUserForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Name is required!
                    </div>
                </div>
                <div class="mb-3 form-group">
                    <label class="form-label" for="create.user.email">Email address</label>
                    <input #email="ngModel"
                           [(ngModel)]="form.email"
                           aria-describedby="emailHelp"
                           class="form-control"
                           id="create.user.email"
                           name="email"
                           required type="email">
                    <div
                        *ngIf="email.errors && createUserForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Email is required!
                    </div>
                </div>

                <div class="mb-3 form-group">
                    <label class="form-label" for="create.user.password">Default Password</label>
                    <input #password="ngModel"
                           [(ngModel)]="form.password"
                           class="form-control"
                           id="create.user.password"
                           name="password"
                           required type="password">
                    <div
                        *ngIf="password.errors && createUserForm.submitted"
                        class="alert alert-danger"
                        role="alert">
                        Password is required!
                    </div>
                </div>

                <button class="btn btn-primary" type="submit">Create</button>
            </form>
        </div>

    `,
    styles: [`

    `]
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

