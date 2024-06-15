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
        <app-launchpad [groups]="groups"></app-launchpad>
    `,
    styles: [``]
})
export class HomeComponent implements OnInit {
    content?: string;
    user: any;
    loading = true;
    groups: any = [
        {
            name: "",
            tiles: [
                {
                    title: "Tenant Overview",
                    subtitle: "View Current Tenant",
                    icon: "fa-building",
                    command: async () => {
                        const tenant_id = this.user.tenant.id;
                        await this.router.navigate(["/TN02", tenant_id]);
                    },
                    size: 'lg'
                },
                {
                    title: "Members",
                    subtitle: "Manage Members",
                    icon: "fa-users",
                    command: async () => {
                        const tenant_id = this.user.tenant.id;
                        await this.router.navigate(["/TN02", tenant_id], {
                            fragment: "MEMBERS"
                        });
                    }
                },
                {
                    title: "Role",
                    subtitle: "Manage Roles",
                    icon: "fa-magic",
                    command: async () => {
                        const tenant_id = this.user.tenant.id;
                        await this.router.navigate(["/TN02", tenant_id], {
                            fragment: "ROLES"
                        });
                    }
                },
            ]
        },
        {
            name: "Tenants",
            tiles: [
                {
                    title: "TN01",
                    subtitle: "Manage All Tenants",
                    icon: "fa-bars",
                    link: ['/TN01']
                },
                {
                    title: "TN02",
                    subtitle: "Display Tenant",
                    icon: "fa-bars",
                    link: ['/TN02']
                },
                {
                    title: "TNRL01",
                    subtitle: "Manage Role Assignments",
                    icon: "fa-magic",
                    link: ['/TNRL01']
                }
            ]
        },
        {
            name: "Users",
            tiles: [
                {
                    title: "Users",
                    subtitle: "Manage Users",
                    icon: "fa-users",
                    link: ['/users']
                }
            ]
        },
        {
            name: "Groups",
            tiles: [
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
                }
            ]
        }
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
