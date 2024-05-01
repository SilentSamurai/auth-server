import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {Router} from "@angular/router";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {ProfileComponent} from "../../profile/profile.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

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
            if (this.tokenStorageService.isSuperAdmin()) {
                this._isSuperAdmin = true;
            }
            this.email = user.email;
        }
    }

    logout(): void {
        this.authDefaultService.signOut("/home");
    }

    async openProfileModal() {
        const modalRef = this.modalService.open(ProfileComponent);
        const result = await modalRef.result;
        console.log("returned result", result);
        // await this.ngOnInit();
    }
}
