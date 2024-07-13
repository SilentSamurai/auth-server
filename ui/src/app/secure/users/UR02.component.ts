import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {EditUserModalComponent} from "./dialogs/edit-user.modal.component";
import {UserService} from "../../_services/user.service";
import {lastValueFrom} from "rxjs";
import {ConfirmationService} from "../../component/dialogs/confirmation.service";
import {MessageService} from "primeng/api";
import {Location} from "@angular/common";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'tenant-details',
    template: `
        <nav-bar></nav-bar>
        <app-object-page>
            <app-object-page-header>
                <app-object-page-title>
                    {{ user.email }}
                </app-object-page-title>
                <app-object-page-subtitle>
                    {{ user.name }}
                </app-object-page-subtitle>
                <div class="row">
                    <div class="col">
                        <app-attribute label="Email">
                            {{ user.email }}
                        </app-attribute>
                        <app-attribute label="Name">
                            {{ user.name }}
                        </app-attribute>
                        <app-attribute label="is Verified">
                            <input class="form-check-input" type="checkbox" value=""
                                   [(ngModel)]="user.verified"
                                   [ngModelOptions]="{standalone: true}">
                            <app-button-link *ngIf="!user.verified" (click)="verifyUser()" class="px-2">
                                Verify
                            </app-button-link>
                        </app-attribute>
                    </div>
                    <div class="col">
                        <app-attribute label="Created At">
                            {{ user.createdAt | date }}
                        </app-attribute>
                        <app-attribute label="Lock Status">
                            Unlocked
                        </app-attribute>
                    </div>
                </div>
            </app-object-page-header>
            <app-object-page-actions>
                <button (click)="openUpdateModal()" class="btn btn-sm btn-primary mx-2">
                    Update
                </button>
                <button (click)="openUpdateModal()" class="btn btn-sm  btn-primary mx-2">
                    Change Password
                </button>
                <button (click)="openUpdateModal()" class="btn btn-sm  btn-primary mx-2">
                    Lock / Unlock
                </button>
                <button (click)="onDelete()" class="btn btn-sm  btn-danger mx-2">
                    Delete
                </button>
            </app-object-page-actions>
            <app-object-page-section name="Tenants">
                <p-table [value]="tenants" responsiveLayout="scroll">
                    <ng-template pTemplate="caption">
                        <div class="d-flex justify-content-between">
                            <h5>Tenant List</h5>
                        </div>

                    </ng-template>
                    <ng-template let-columns pTemplate="header">
                        <tr>
                            <th>Tenant Id</th>
                            <th>Name</th>
                            <th>Domain</th>
                            <th>Roles</th>
                        </tr>
                    </ng-template>
                    <ng-template let-columns="columns" let-tenant pTemplate="body">
                        <tr>
                            <td><span class="p-column-title">Tenant Id</span>
                                <a [routerLink]="['/TN02/', tenant.id]"
                                   href="javascript:void(0)">{{ tenant.id }}</a>
                            </td>
                            <td><span class="p-column-title">Name</span>{{ tenant.name }}</td>
                            <td><span class="p-column-title">Domain</span>{{ tenant.domain }}</td>
                            <td><span class="p-column-title">Roles</span>
                                <a [routerLink]="['/TNRL01/', tenant.id, user.id]"
                                   href="javascript:void(0)">View Role Assignments
                                </a>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </app-object-page-section>
        </app-object-page>
    `,
    styles: []
})
export class UR02Component implements OnInit {

    userId: string = "";
    user: any = {
        name: "",
        createdAt: ""
    };
    tenants: any = [];

    constructor(private userService: UserService,
                private actRoute: ActivatedRoute,
                private confirmationService: ConfirmationService,
                private messageService: MessageService,
                private _location: Location,
                private authDefaultService: AuthDefaultService,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.authDefaultService.setTitle("UR02: Manage User");
        this.userId = this.actRoute.snapshot.params['userId'];
        console.log(this.userId)
        this.user = await lastValueFrom(this.userService.getUser(this.userId));
        this.tenants = await lastValueFrom(this.userService.getUserTenants(this.userId))
    }

    openUpdateModal() {
        const modalRef = this.modalService.open(EditUserModalComponent);
        modalRef.componentInstance.user = this.user;
    }

    async onDelete() {
        const deletedUser = await this.confirmationService.confirm({
            message: `Are you sure you want to delete ${this.user.email} ?`,
            header: 'Confirmation',
            icon: 'pi pi-info-circle',
            accept: async () => {
                try {
                    let deletedUser = await this.userService.deleteUser(this.user.id);
                    this.messageService.add({severity: 'success', summary: 'Success', detail: 'User Deleted'});
                    return deletedUser;
                } catch (e) {
                    this.messageService.add({severity: 'error', summary: 'Error', detail: 'User Deletion Failed'});
                }
                return null;
            }
        })
        console.log(deletedUser);
        this._location.back();
    }

    async verifyUser() {
        console.log("verify");
        await this.userService.verifyUser(this.user.email, true);
        await this.ngOnInit();
    }
}
