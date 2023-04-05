import {Component, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    content?: string;
    user: any;

    constructor(private userService: UserService, private tokenService: TokenStorageService) {
    }

    ngOnInit(): void {
        this.user = this.tokenService.getUser();
    }
}
