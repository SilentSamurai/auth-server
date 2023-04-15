import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {Router} from "@angular/router";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    content?: string;
    user: any;

    constructor(private userService: UserService,
                private router: Router,
                private tokenStorageService: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {
        this.user = this.tokenStorageService.getUser();
        if (!this.tokenStorageService.isSuperAdmin()) {
            await this.router.navigateByUrl(`/tenant/${this.user.tenant.id}`);
        }
    }
}
