import {Component, OnInit} from '@angular/core';
import {SessionService} from '../_services/session.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    currentUser: any;
    token: any;

    constructor(private tokenStorageService: SessionService) {
    }

    ngOnInit(): void {
        this.currentUser = this.tokenStorageService.getUser();
        this.token = this.tokenStorageService.getToken();
        console.log(this.currentUser);
    }


}
