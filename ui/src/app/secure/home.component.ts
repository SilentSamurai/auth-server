import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {SessionService} from '../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../_services/auth.service';
import {AuthDefaultService} from '../_services/auth.default.service';
import {makeLaunchPad} from '../component/tile/models';
import {
    Actions,
    PermissionService,
    Subjects,
} from '../_services/permission.service';

@Component({
    selector: 'app-home',
    template: `
        <nav-bar *ngIf="!loading"></nav-bar>
        <app-launchpad [groups]="groups"></app-launchpad>
    `,
    styles: [``],
})
export class HomeComponent implements OnInit {
    content?: string;
    user: any;
    loading = true;
    groups: any = [
        {
            name: 'Home',
            tiles: [
                {
                    title: 'Tenant Overview',
                    subtitle: 'View Current Tenant',
                    icon: 'fa-building',
                    command: async () => {
                        const tenant_id = this.user.tenant.id;
                        await this.router.navigate(['/TN02', tenant_id]);
                    },
                    size: 'lg',
                },
                {
                    title: 'Members',
                    subtitle: 'Manage Members',
                    icon: 'fa-users',
                    command: async () => {
                        const tenant_id = this.user.tenant.id;
                        await this.router.navigate(['/TN02', tenant_id], {
                            fragment: 'MEMBERS',
                        });
                    },
                },
                {
                    title: 'Role',
                    subtitle: 'Manage Roles',
                    icon: 'fa-magic',
                    command: async () => {
                        const tenant_id = this.user.tenant.id;
                        await this.router.navigate(['/TN02', tenant_id], {
                            fragment: 'ROLES',
                        });
                    },
                },
            ],
        },
        {
            name: 'Tenants',
            tiles: [
                {
                    title: 'TN01',
                    subtitle: 'Manage All Tenants',
                    icon: 'fa-bars',
                    link: ['/TN01'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Manage, Subjects.TENANT);
                    },
                },
                {
                    title: 'TN02',
                    subtitle: 'Display Tenant',
                    icon: 'fa-bars',
                    link: ['/TN02'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Read, Subjects.TENANT);
                    },
                },
                {
                    title: 'TNRL01',
                    subtitle: 'Manage Role Assignments',
                    icon: 'fa-magic',
                    link: ['/TNRL01'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Manage, Subjects.TENANT);
                    },
                },
            ],
        },
        {
            name: 'Users',
            tiles: [
                {
                    title: 'UR01',
                    subtitle: 'Manage Users',
                    icon: 'fa-users',
                    link: ['/UR01'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Manage, Subjects.USER);
                    },
                },
                {
                    title: 'UR02',
                    subtitle: 'Display User',
                    icon: 'fa-users',
                    link: ['/UR02'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Read, Subjects.USER);
                    },
                },
            ],
        },
        {
            name: 'Groups',
            tiles: [
                {
                    title: 'GP01',
                    subtitle: 'Manage Groups',
                    icon: 'fa-group',
                    link: ['/GP01'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Manage, Subjects.GROUP);
                    },
                },
                {
                    title: 'GP02',
                    subtitle: 'Display Group',
                    icon: 'fa-group',
                    link: ['/GP02'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Read, Subjects.GROUP);
                    },
                },
            ],
        },
        {
            name: 'Roles',
            tiles: [
                {
                    title: 'RL01',
                    subtitle: 'Manage Roles',
                    icon: 'fa-casl',
                    link: ['/RL01'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Manage, Subjects.ROLE);
                    },
                },
                {
                    title: 'RL02',
                    subtitle: 'Display Role',
                    icon: 'fa-role',
                    link: ['/RL02'],
                    canActivate: (ps: PermissionService) => {
                        return ps.isAuthorized(Actions.Read, Subjects.ROLE);
                    },
                },
            ],
        },
    ];

    constructor(
        private userService: UserService,
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private ps: PermissionService,
        private authDefaultService: AuthDefaultService,
        private tokenStorage: SessionService,
    ) {
        this.groups = makeLaunchPad(this.groups, this.ps);
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
