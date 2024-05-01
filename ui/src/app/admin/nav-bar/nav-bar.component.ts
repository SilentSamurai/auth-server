import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {UserService} from "../../_services/user.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ProfileComponent} from "../../profile/profile.component";

@Component({
    selector: 'admin-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.css']
})
export class AdminNavBarComponent implements OnInit {
    isLoggedIn = false;
    email?: string;
    _isSuperAdmin = true;
    public isCollapsed = true;

    constructor(private userService: UserService,
                private router: Router,
                private modalService: NgbModal,
                private authDefaultService: AuthDefaultService,
                private tokenStorageService: TokenStorageService) {

    }

    isSuperAdmin() {
        return this._isSuperAdmin;
    }

    async ngOnInit(): Promise<void> {
        this.isLoggedIn = !!this.tokenStorageService.getToken();

        if (this.isLoggedIn) {
            const user = this.tokenStorageService.getUser();
            this.email = user.email;
        }
    }

    logout(): void {
        this.authDefaultService.signOut("/admin");
    }

    async openProfileModal() {
        const modalRef = this.modalService.open(ProfileComponent);
        const result = await modalRef.result;
        console.log("returned result", result);
        // await this.ngOnInit();
    }
}
