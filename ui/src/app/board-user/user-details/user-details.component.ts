import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {UserService} from "../../_services/user.service";
import {firstValueFrom, lastValueFrom} from "rxjs";
import {ConfirmationService, MessageService} from "primeng/api";
import {DialogService} from "primeng/dynamicdialog";
import {EditUserModalComponent} from "../edit-user-modal/edit-user-modal.component";

@Component({
    selector: 'tenant-details',
    templateUrl: './user-details.component.html',
    styleUrls: [],
    providers: [ConfirmationService, MessageService, DialogService]
})
export class UserDetailsComponent implements OnInit {

    loading = true;
    user_email: string = "";
    user: any = {
        name: "",
        createdAt: ""
    };
    tenants: any = [];
    updateDialog = false;

    constructor(private userService: UserService,
                private router: Router,
                private messageService: MessageService,
                private dialogService: DialogService,
                private confirmationService: ConfirmationService,
                private actRoute: ActivatedRoute) {
    }

    async ngOnInit(): Promise<void> {
        this.loading = true;
        this.user_email = this.actRoute.snapshot.params['email'];
        console.log(this.user_email)
        this.user = await lastValueFrom(this.userService.getUser(this.user_email));
        this.tenants = await lastValueFrom(this.userService.getUserTenants(this.user_email));
        this.loading = false;
    }

    confirmDelete(event: Event) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Are you sure that you want to proceed?',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                await this.onYes();
                // this.messageService.add({severity: 'success', summary: 'Confirmed', detail: 'You have accepted'});
            },
            reject: () => {
                // this.messageService.add({severity: 'error', summary: 'Rejected', detail: 'You have rejected'});
            }
        });
    }

    async onYes() {
        try {
            let deletedUser: any = this.userService.deleteUser(this.user.id);
            deletedUser = await lastValueFrom(deletedUser);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'User Deleted'});
            // this.passEntry.emit(deletedUser);
            // this.activeModal.close(deletedUser);
            await this.router.navigateByUrl("/users");
        } catch (e: any) {
            console.error(e);
            this.messageService.add({severity: 'error', summary: 'Error', detail: e.error.message});
        }

    }

    async openUpdateModal() {
        let modalRef = this.dialogService.open(EditUserModalComponent, {
            data: {
                user: this.user
            },
            header: "Update User",
            width: "50vh",
            modal: true
        });
        const user = await firstValueFrom(modalRef.onClose);
        modalRef.destroy();
        console.log(user);
        await this.ngOnInit();
        this.updateDialog = true;
        // const modalRef = this.modalService.open(EditUserModalComponent);
        // modalRef.componentInstance.user = this.user;
    }

    async completeUpdate($event: any) {
        await this.ngOnInit();
        this.updateDialog = false;
    }
}
