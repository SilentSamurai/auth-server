import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {EditUserModalComponent} from "./dialogs/edit-user.modal.component";
import {UserService} from "../../_services/user.service";
import {lastValueFrom} from "rxjs";

@Component({
    selector: 'tenant-details',
    template: `
        <nav-bar></nav-bar>
        <app-object-page>
            <app-object-page-header>
                <app-object-page-title>
                    {{ user_email }}
                </app-object-page-title>
                <app-object-page-subtitle>
                    {{ user.name }}
                </app-object-page-subtitle>
                <div class="row">
                    <div class="col">
                        <app-attribute label="Email">
                            {{ user_email }}
                        </app-attribute>
                        <app-attribute label="Name">
                            {{ user.name }}
                        </app-attribute>
                        <app-attribute label="Created At">
                            {{ user.createdAt | date }}
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
                                <a [routerLink]="['/tenant/', tenant.id]"
                                   href="javascript:void(0)">{{ tenant.id }}</a>
                            </td>
                            <td><span class="p-column-title">Name</span>{{ tenant.name }}</td>
                            <td><span class="p-column-title">Domain</span>{{ tenant.domain }}</td>
                            <td><span class="p-column-title">Roles</span>
                                <a [routerLink]="['/TNRL01/', tenant.id, user.email]"
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

    user_email: string = "";
    user: any = {
        name: "",
        createdAt: ""
    };
    tenants: any = [];

    constructor(private userService: UserService,
                private actRoute: ActivatedRoute,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.user_email = this.actRoute.snapshot.params['email'];
        console.log(this.user_email)
        this.user = await lastValueFrom(this.userService.getUser(this.user_email));
        this.tenants = await lastValueFrom(this.userService.getUserTenants(this.user_email))
    }

    openUpdateModal() {
        const modalRef = this.modalService.open(EditUserModalComponent);
        modalRef.componentInstance.user = this.user;
    }

}
