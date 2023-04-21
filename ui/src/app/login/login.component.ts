import {Component, OnInit} from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {TokenStorageService} from '../_services/token-storage.service';
import {Router} from "@angular/router";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    form: any = {
        email: null,
        password: null,
        domain: null
    };
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    scopes: string[] = [];

    constructor(private authService: AuthService,
                private router: Router,
                private tokenStorage: TokenStorageService) {
    }

    ngOnInit(): void {
        if (this.tokenStorage.isLoggedIn()) {
            this.isLoggedIn = true;
            this.scopes = this.tokenStorage.getUser().scopes;
            this.router.navigateByUrl("/home");
        }
    }

    onSubmit(): void {
        const {email, password, domain} = this.form;

        this.authService.login(email, password, domain).subscribe({
            next: data => {
                this.tokenStorage.saveToken(data.access_token);

                this.isLoginFailed = false;
                this.isLoggedIn = true;
                this.scopes = this.tokenStorage.getUser().scopes;
                this.reloadPage();
            },
            error: err => {
                this.errorMessage = err.error.message;
                this.isLoginFailed = true;
            }
        });
    }

    reloadPage(): void {
        window.location.reload();
    }
}
