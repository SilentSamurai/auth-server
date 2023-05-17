import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {lastValueFrom} from "rxjs";
import {AuthService} from "../_services/auth.service";

@Component({
    selector: 'app-home',
    templateUrl: './otp-display.component.html',
    styleUrls: ['./otp-display.component.css']
})
export class OtpDisplayComponent implements OnInit {
    content?: string;
    user: any;
    loading = true;
    code = "";

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private tokenStorage: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {
        let params = this.route.snapshot.queryParamMap;
        if (params.has("code")) {
            try {
                this.code = params.get("code")!;
                let verifier = this.tokenStorage.getCodeVerifier();
                const data = await lastValueFrom(this.authService.getAccessToken(this.code, verifier));
                this.tokenStorage.saveToken(data.access_token);
            } catch (e: any) {
                console.error(e);
            }
        }

        if (this.tokenStorage.isLoggedIn()) {
            this.user = this.tokenStorage.getUser();
        }
        this.loading = false;
    }

    reloadPage(): void {
        window.location.reload();
    }
}
