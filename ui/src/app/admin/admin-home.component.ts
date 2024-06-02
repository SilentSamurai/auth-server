import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../_services/auth.service";
import {AuthDefaultService} from "../_services/auth.default.service";

@Component({
    selector: 'app-admin-home',
    template: `
        <admin-nav-bar *ngIf="!loading"></admin-nav-bar>
        <div *ngIf="!loading" class="container-fluid">
            <header class="jumbotron">
                <h1 class="mt-4">Welcome "{{ user.name }}"</h1>
                <p>Hey, Checkout the user and tenant content present</p>
            </header>
            <app-tile-group [tiles]="tiles"></app-tile-group>
        </div>
    `,
    styles: [``]
})
export class AdminHomeComponent implements OnInit {
    content?: string;
    user: any;
    loading = true;
    tiles: any = [
        {
            title: "Tenants",
            subtitle: "manage tenants",
            icon: "fa-bars",
            link: ['/admin', 'tenants']
        },
        {
            title: "Users",
            subtitle: "Manage Users",
            icon: "fa-users",
            link: ['/admin', 'users']
        },
        {
            title: "RL02",
            subtitle: "Manage Role Assignments",
            icon: "fa-magic",
            link: ['/admin', 'RL02']
        },
    ];

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private tokenStorage: TokenStorageService) {
    }

    ngOnInit(): void {
        this.authDefaultService.resetTitle();
        this.startUp();
    }

    async startUp(): Promise<void> {
        // let params = this.route.snapshot.queryParamMap;
        this.user = this.tokenStorage.getUser();
        this.loading = false;
    }

    reloadPage(): void {
        window.location.reload();
    }
}
