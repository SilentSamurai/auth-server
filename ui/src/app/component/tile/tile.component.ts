import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'app-tile',
    template: `
        <div class="card tile tile-{{tile.size}} shadow-sm">
            <div class="card-body">
                <div class="card-title h4">
                    {{ tile.title }}
                </div>
                <div class="tile-body-{{tile.size}} card-text">
                    {{ tile.subtitle }}
                </div>

                <div class="card-text">
                    <i aria-hidden="true" class="fa fa-icons {{ tile.icon }} fa-2x"></i>
                </div>
            </div>
        </div>
    `,
    styles: [`

    `]
})
export class TileComponent implements OnInit {

    @Input()
    tile: any;

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private tokenStorage: TokenStorageService) {
    }


    ngOnInit(): void {
        console.log(this.tile);
    }
}
