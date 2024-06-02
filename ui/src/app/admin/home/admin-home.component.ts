import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'app-admin-home',
    templateUrl: './admin-home.component.html',
    styleUrls: ['./admin-home.component.css']
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
            link: ['/admin', 'RL02-SEL']
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
