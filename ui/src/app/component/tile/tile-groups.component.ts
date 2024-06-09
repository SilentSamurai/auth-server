import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'app-tile-group',
    template: `
        <div class="row row-cols-auto my-2">
            <div *ngFor="let tile of internalTile; index as i;" class="col py-1">
                <ng-container *ngIf="tile.isCallbackThere">
                    <a (click)="tile.command()"
                       class="text-decoration-none">
                        <app-tile [tile]="tile">
                        </app-tile>
                    </a>
                </ng-container>
                <ng-container *ngIf="!tile.isCallbackThere">
                    <a [routerLink]="tile.link"
                       class="text-decoration-none">
                        <app-tile [tile]="tile">
                        </app-tile>
                    </a>
                </ng-container>
            </div>
        </div>
    `,
    styles: [`
    `]
})
export class TileGroupsComponent implements OnInit {

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
                isCallbackThere: tile.hasOwnProperty("command") && typeof tile.command === 'function',
                command: tile.command,
                icon: tile.icon,
                size: tile.size || 'md',
            })
        }
        console.log(this.tiles);
    }
}
