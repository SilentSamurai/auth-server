import {Component, OnInit} from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {lastValueFrom} from "rxjs";
import {Router} from "@angular/router";

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
    form: any = {
        name: null,
        email: null,
        password: null
    };
    isSuccessful = false;
    isSignUpFailed = false;
    errorMessage = '';

    constructor(private authService: AuthService,
                private router: Router,) {
    }

    ngOnInit(): void {
    }

    async onSubmit(): Promise<void> {
        const {name, email, password} = this.form;
        this.isSignUpFailed = false;
        try {
            const user = await lastValueFrom(this.authService.register(name, email, password));
            await this.router.navigateByUrl("/login");
            this.isSuccessful = false;
        } catch (e: any) {
            console.error(e);
            this.isSignUpFailed = true;
            this.errorMessage = e.error.message;
        }


    }
}
