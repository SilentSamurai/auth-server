import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {Router} from "@angular/router";
import {MenuItem} from "primeng/api";

@Component({
    selector: 'nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
    isLoggedIn = false;
    email?: string;
    _isSuperAdmin = false;
    public isCollapsed = true;

    items: MenuItem[] = [
        {
            label: 'Users',
            icon: 'pi pi-fw pi-users',
            command: async () => {
                await this.router.navigateByUrl("/users");
            }
        },
        {
            label: 'Tenants',
            icon: 'pi pi-fw pi-bars',
            command: async () => {
                await this.router.navigateByUrl("/tenants");
            }
        }
    ];

    userMenu: MenuItem[] = [
        {
            label: 'Profile',
            command: async () => {
                await this.router.navigateByUrl("/profile");
            }
        },
        {
            label: 'Settings'
        },
        {
            separator: true
        },
        {
            label: 'Logout',
            command: () => {
                this.logout();
            }
        }
    ];

    constructor(private userService: UserService,
                private router: Router,
                private tokenStorageService: TokenStorageService) {

    }

    isSuperAdmin() {
        return this._isSuperAdmin;
    }

    async ngOnInit(): Promise<void> {
        this.isLoggedIn = !!this.tokenStorageService.getToken();

        if (this.isLoggedIn) {
            const user = this.tokenStorageService.getUser();
            if (this.tokenStorageService.isSuperAdmin()) {
                this._isSuperAdmin = true;
            }

            this.email = user.email;
        }
    }

    logout(): void {
        this.tokenStorageService.signOut();
        this.router.navigateByUrl(`/login`);
    }
}
