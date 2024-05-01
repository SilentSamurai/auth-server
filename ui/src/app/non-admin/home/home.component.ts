import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    content?: string;
    user: any;
    loading = true;

    tiles = [
        {
            title: "Tenant overview",
            subtitle: "Tenant overview",
            icon: "fa-building",
            link: [],
            size: 'lg'
        },
        {
            title: "Members",
            subtitle: "manage members",
            icon: "fa-users",
            link: ['/tenant/']
        },
        {
            title: "Role",
            subtitle: "manage roles",
            icon: "fa-magic",
            link: ['/tenant/']
        }
    ]

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private tokenStorage: TokenStorageService) {
    }

    ngOnInit(): void {
        this.startUp();
    }

    async startUp(): Promise<void> {
        // let params = this.route.snapshot.queryParamMap;

        if (this.tokenStorage.isLoggedIn()) {
            this.user = this.tokenStorage.getUser();
            this.tiles[0].link = ['/tenant/', this.user.tenant.id]
        } else {
            await this.authDefaultService.signOut('/home');
        }
        this.loading = false;
    }

    reloadPage(): void {
        window.location.reload();
    }
}
