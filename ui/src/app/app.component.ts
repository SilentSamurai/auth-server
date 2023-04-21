import {Component} from '@angular/core';
import {TokenStorageService} from './_services/token-storage.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    isLoggedIn = false;
    email?: string;
    isSuperAdmin = false;
    private scopes: string[] = [];

    constructor(private tokenStorageService: TokenStorageService) {
    }

    ngOnInit(): void {
        this.isLoggedIn = !!this.tokenStorageService.getToken();

        if (this.isLoggedIn) {
            const user = this.tokenStorageService.getUser();
            this.scopes = user.scopes;
            if (this.tokenStorageService.isSuperAdmin()) {
                this.isSuperAdmin = true;
            }

            this.email = user.email;
        }
    }

    logout(): void {
        this.tokenStorageService.signOut();
        window.location.reload();
    }
}
