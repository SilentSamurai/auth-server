import {Component, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {lastValueFrom} from "rxjs";
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

        this.loading = false;
    }

    reloadPage(): void {
        window.location.reload();
    }
}
