import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../_services/auth.service";
import {AuthDefaultService} from "../_services/auth.default.service";

@Component({
    selector: 'app-home',
    template: `
        <nav-bar *ngIf="!loading"></nav-bar>
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
export class HomeComponent implements OnInit {
    content?: string;
    user: any;
    loading = true;
    tiles: any = [
        {
            title: "Tenant Overview",
            subtitle: "View Current Tenant",
            icon: "fa-building",
            command: async () => {
                const tenant_id = this.user.tenant.id;
                await this.router.navigate(["/tenant", tenant_id]);
            },
            size: 'lg'
        },
        {
            title: "Members",
            subtitle: "Manage Members",
            icon: "fa-users",
            command: async () => {
                const tenant_id = this.user.tenant.id;
                await this.router.navigate(["/tenant", tenant_id], {
                    queryParams: {
                        nav: "MEM"
                    }
                });
            }
        },
        {
            title: "Role",
            subtitle: "Manage Roles",
            icon: "fa-magic",
            command: async () => {
                const tenant_id = this.user.tenant.id;
                await this.router.navigate(["/tenant", tenant_id], {
                    queryParams: {
                        nav: "ROLE"
                    }
                });
            }
        },
        {
            title: "Tenants",
            subtitle: "Manage All Tenants",
            icon: "fa-bars",
            link: ['/tenants']
        },
        {
            title: "Users",
            subtitle: "Manage Users",
            icon: "fa-users",
            link: ['/users']
        },
        {
            title: "RL02",
            subtitle: "Manage Role Assignments",
            icon: "fa-magic",
            link: ['/RL02']
        },
        {
            title: "GP01",
            subtitle: "Manage Groups",
            icon: "fa-group",
            link: ['/GP01']
        },
        {
            title: "GP02",
            subtitle: "Display Group",
            icon: "fa-group",
            link: ['/GP02']
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
