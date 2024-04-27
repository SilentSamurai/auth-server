import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {Router} from "@angular/router";

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
    }
}
