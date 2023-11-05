import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {TenantService} from "../../_services/tenant.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {TokenStorageService} from "../../_services/token-storage.service";
import {DialogService} from "primeng/dynamicdialog";
import {firstValueFrom} from "rxjs";
import {UpdateTenantComponent} from "../update-tenant/update-tenant.component";
import {AddMemberComponent} from "./add-member/add-member.component";
import {AddScopeComponent} from "./add-scope/add-scope.component";
import {AssignScopeComponent} from "./assign-scope/assign-scope.component";

@Component({
    selector: 'tenant-details',
    templateUrl: './tenant-details.component.html',
    styleUrls: ['./tenant-details.component.scss'],
    providers: [DialogService, ConfirmationService, MessageService]
})
export class TenantDetailsComponent implements OnInit {

    tenant_id: string = "";
    tenant: any = {};
    credentials: any = {
        clientId: "NA",
        clientSecret: "NA",
        publicKey: "NA"
    };
    members: any = []
    isTenantAdmin = false;

    constructor(private tenantService: TenantService,
                private router: Router,
                private tokenStorageService: TokenStorageService,
                private messageService: MessageService,
                private dialogService: DialogService,
                private confirmationService: ConfirmationService,
                private actRoute: ActivatedRoute) {
    }

    async ngOnInit() {
        this.tenant_id = this.actRoute.snapshot.params['tenantId'];
        if (this.tokenStorageService.isTenantAdmin()) {
            this.isTenantAdmin = true;
            this.credentials = await this.tenantService.getTenantCredentials(this.tenant_id);
        }
        console.log(this.tenant_id);
        this.tenant = await this.tenantService.getTenantDetails(this.tenant_id);
        this.members = await this.tenantService.getMembers(this.tenant_id);
    }

    async onUpdateTenant() {
        let modalRef = this.dialogService.open(UpdateTenantComponent, {
            data: {
                tenant: this.tenant,
            },
            header: "Update Tenant",
            width: "50vh",
            modal: true
        });
        const tenant = await firstValueFrom(modalRef.onClose);
        modalRef.destroy();
        console.log(tenant);
        await this.ngOnInit();
    }

    async onAddMember() {
        let modalRef = this.dialogService.open(AddMemberComponent, {
            data: {
                tenant: this.tenant,
            },
            header: "Add Member",
            width: "50vh",
            modal: true
        });
        const addedMember = await firstValueFrom(modalRef.onClose);
        modalRef.destroy();
        console.log(addedMember);
        await this.ngOnInit();
    }

    async onAddScope() {
        let modalRef = this.dialogService.open(AddScopeComponent, {
            data: {
                tenant: this.tenant,
            },
            header: "Add Scope",
            width: "50vh",
            modal: true
        });
        const addedScope = await firstValueFrom(modalRef.onClose);
        modalRef.destroy();
        console.log(addedScope);
        await this.ngOnInit();
    }

    async onRemoveScope(event: Event, scope: any) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Are you sure that you want to remove the scope?',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                await this.deleteScope(scope);
                // this.messageService.add({severity: 'success', summary: 'Confirmed', detail: 'You have accepted'});
            },
            reject: () => {
                // this.messageService.add({severity: 'error', summary: 'Rejected', detail: 'You have rejected'});
            }
        });
        await this.ngOnInit();
    }

    async deleteScope(scope: any) {
        try {
            let deletedScope = await this.tenantService.removeScope(scope.name, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Scope Deleted'});
            await this.ngOnInit();
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Scope Deletion Failed'});
        }

    }

    async onAssignRole(user: any) {
        let modalRef = this.dialogService.open(AssignScopeComponent, {
            data: {
                tenant: this.tenant,
                user: user
            },
            header: "Assign Scope",
            width: "50vh",
            height: "50vh",
            modal: true
        });
        const addedScope = await firstValueFrom(modalRef.onClose);
        modalRef.destroy();
        console.log(addedScope);
        await this.ngOnInit();
    }

    async removeMember(event: Event, user: any) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Are you sure that you want remove the member?',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                await this.removeMemberApiCall(user);
                // this.messageService.add({severity: 'success', summary: 'Confirmed', detail: 'You have accepted'});
            },
            reject: () => {
                // this.messageService.add({severity: 'error', summary: 'Rejected', detail: 'You have rejected'});
            }
        });
    }

    async removeMemberApiCall(user: any) {
        try {
            const removedMember = await this.tenantService.removeMember(user.email, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Member Removed'});
            await this.ngOnInit();
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to remove member'});
        }
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
            let deletedTenant = await this.tenantService.deleteTenant(this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Deleted'});
            // this.passEntry.emit(deletedTenant);
            // this.activeModal.close(deletedTenant);
            await this.router.navigateByUrl("/tenants");
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Deletion Failed'});
        }
    }


}
