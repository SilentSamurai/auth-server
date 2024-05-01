import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'app-tile',
    templateUrl: './tile.component.html',
    styleUrls: ['./tile.component.css']
})
export class TileComponent implements OnInit {

    @Input()
    tiles: any;

    internalTile: any[] = [];
    sizeMap = {
        'sm': {
            width: '100px',
            height: '100px'
        },
        'md': {
            width: '200px',
            height: '200px'
        },
        'lg': {
            width: '425px',
            height: '200px'
        }
    }

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private tokenStorage: TokenStorageService) {
    }

    findSize(size: string) {
        if (size === 'sm') {
            return this.sizeMap.sm;
        }
        if (size === 'lg') {
            return this.sizeMap.lg;
        }
        return this.sizeMap.md;
    }


    ngOnInit(): void {
        for (let tile of this.tiles) {
            this.internalTile.push({
                title: tile.title,
                link: tile.link,
                subtitle: tile.subtitle,
                icon: tile.icon,
                size: this.findSize(tile.size),
            })
        }
        console.log(this.tiles);
    }
}
