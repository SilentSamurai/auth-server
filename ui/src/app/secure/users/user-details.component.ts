import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {EditUserModalComponent} from "./edit-user.modal.component";
import {UserService} from "../../_services/user.service";
import {lastValueFrom} from "rxjs";

@Component({
    selector: 'tenant-details',
    template: `
        <nav-bar></nav-bar>
        <div class="container-fluid">
            <div class="row justify-content-center my-2">
                <div class="col-md-8">
                    <div class="card text-black">
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
                                        <ul>
                                            <li *ngFor="let role of tenant.roles">
                                                <code>{{ tenant.name }}::{{ role.name }}</code>
                                            </li>
                                        </ul>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-black">
                        <div class="card-body">
                            <div>
                                <div class="my-2">
                                    <div class="p-disabled">Email</div>
                                    <h3>{{ user_email }}</h3>
                                </div>
                                <br>
                                <div class="my-2">
                                    <div class="p-disabled">Name</div>
                                    <div>{{ user.name }}</div>
                                </div>
                                <div class="my-2">
                                    <div class="p-disabled">Created At</div>
                                    <div>{{ user.createdAt | date }}</div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between total font-weight-bold mt-4">
                                <button (click)="openUpdateModal()" class="btn btn-primary">
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: []
})
export class UserDetailsComponent implements OnInit {

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
