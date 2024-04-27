import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
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
    authCode = "";
    redirectUri = "";
    username = "";

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private tokenStorage: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {
        let params = this.route.snapshot.queryParamMap;
        this.redirectUri = params.get("redirect")!;

        const authCode = this.tokenStorage.getAuthCode();
        if (authCode) {
            // if auth code is present, then redirect
            // verify auth-code
            try {
                const data = await this.authService.validateAuthCode(authCode);
                this.authCode = authCode;
                this.username = data.email;
            } catch (e: any) {
                console.error(e);
            }
        }

        this.loading = false;
    }

    async onContinue() {
        await this.redirect(this.authCode);
    }

    async onLogout() {
        await this.tokenStorage.signOut();
    }

    async redirect(code: string) {
        if (this.isAbsoluteUrl(this.redirectUri)) {
            window.location.href = `${this.redirectUri}?code=${code}`;
        } else {
            await this.router.navigate([this.redirectUri], {
                queryParams: {
                    code: code
                }
            });
        }
    }

    protected isAbsoluteUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }


}
