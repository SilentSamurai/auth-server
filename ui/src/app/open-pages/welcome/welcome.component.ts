import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../_services/session.service';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

    constructor(private router: Router, private sessionService: SessionService) { }

    ngOnInit(): void {
        if (this.sessionService.isLoggedIn() && !this.sessionService.isTokenExpired()) {
            this.router.navigate(['/home']);
        }
    }

}
