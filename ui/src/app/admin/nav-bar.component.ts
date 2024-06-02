import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {UserService} from "../_services/user.service";
import {AuthDefaultService} from "../_services/auth.default.service";
import {TokenStorageService} from "../_services/token-storage.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ProfileComponent} from "../profile/profile.component";

@Component({
    selector: 'admin-nav-bar',
    template: `
        <nav class="navbar navbar-expand-lg bg-secondary" ngbNav>
            <a class="navbar-brand" href="javascript:void(0)" routerLink="/admin">
                <img alt="" class="rounded-circle mx-2" height="30" src="/assets/logo-img.jpg" width="30">
                {{ this.getTitle() }}
            </a>
            <button aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                    class="navbar-toggler"
                    data-bs-target="#navbarSupportedContent"
                    data-bs-toggle="collapse"
                    (click)="isCollapsed = !isCollapsed"
                    type="button">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div [ngbCollapse]="isCollapsed" class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav px-2 w-100">
                    <li [ngbNavItem]="3" class="nav-item" class="ms-auto" ngbDropdown placement="bottom-left">
                        <a class="nav-link mt-1"
                           id="dropdownUser1"
                           ngbDropdownToggle>
                            <span class="mt-1">{{ email }}</span>
                        </a>
                        <div aria-labelledby="dropdownUser1"
                             class="dropdown-menu text-small shadow" ngbDropdownMenu>
                            <a href="#" ngbDropdownItem>Settings</a>
                            <a href="javascript:void(0)"
                               ngbDropdownItem
                               (click)="openProfileModal()">Profile</a>
                            <hr class="dropdown-divider">
                            <a href="https://silentsamurai.github.io/auth-server" ngbDropdownItem>
                                Api Docs
                            </a>
                            <hr class="dropdown-divider">
                            <a (click)="logout()" href="javascript:void(0)" ngbDropdownItem>
                                Sign Out
                            </a>
                        </div>

                    </li>
                </ul>
            </div>
        </nav>
    `,
    styles: ['']
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

    getTitle() {
        return this.authDefaultService.title;
    }
}
