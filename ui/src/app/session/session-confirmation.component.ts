import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../_services/auth.service";
import {AuthDefaultService} from "../_services/auth.default.service";

@Component({
    selector: 'session-confirm',
    templateUrl: './session-confirmation.component.html',
    styleUrls: ['./session-confirmation.component.css']
})
export class SessionConfirmationComponent implements OnInit {
    content?: string;
    user: any;
    loading = true;
    authCode = "";
    redirectUri = "";
    username = "";
    code_challenge = "";
    client_id = "";

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private tokenStorage: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {
        let params = this.route.snapshot.queryParamMap;
        this.redirectUri = params.get("redirect_uri")!;
        this.client_id = params.get("client_id")!;
        this.code_challenge = params.get("code_challenge")!;


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
        this.tokenStorage.clearSession();
        await this.router.navigate(['login'], {
            queryParams: {
                redirect_uri: this.redirectUri,
                client_id: this.client_id,
                code_challenge: this.code_challenge
            }
        });

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
