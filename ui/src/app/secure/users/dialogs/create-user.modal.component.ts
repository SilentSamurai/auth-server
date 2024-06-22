import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {UserService} from '../../../_services/user.service';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";

@Component({
    selector: 'create-user-modal',
    template: `
        <app-standard-dialog title="Create User" subtitle="Create a system user">
            <app-dialog-tab>
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
                            class="text-danger"
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
                            class="text-danger"
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
                            class="text-danger"
                            role="alert">
                            Password is required!
                        </div>
                    </div>


                </form>
            </app-dialog-tab>
            <app-dialog-footer>
                <button class="btn btn-primary" type="submit" (click)="createUserForm.onSubmit(krishna)">
                    Create</button>
            </app-dialog-footer>
        </app-standard-dialog>
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
    krishna: any;

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

