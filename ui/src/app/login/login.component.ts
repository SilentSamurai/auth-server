import {Component, OnInit} from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {TokenStorageService} from '../_services/token-storage.service';
import {ActivatedRoute, Router} from "@angular/router";

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
    freezeDomain = false;

    constructor(private authService: AuthService,
                private router: Router,
                private route: ActivatedRoute,
                private tokenStorage: TokenStorageService) {
    }

    async ngOnInit(): Promise<void> {
        // console.log("aishfias");
        if (this.tokenStorage.isLoggedIn()) {
            this.isLoggedIn = true;
            this.scopes = this.tokenStorage.getUser().scopes;
            await this.router.navigateByUrl("/home");
        }

        let params = this.route.snapshot.queryParamMap;
        this.freezeDomain = params.has("domain");
        this.form.domain = params.get("domain");
        console.log(params, this.freezeDomain);

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
