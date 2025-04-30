import {Component, Input, OnInit} from '@angular/core';
import {SessionService} from '../../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../_services/auth.service';
import {AuthDefaultService} from '../../_services/auth.default.service';
import {Tile} from './models';
import {PermissionService} from '../../_services/permission.service';

@Component({
    selector: 'app-tile-group',
    template: `
        <div class="row row-cols-auto my-2">
            <ng-container *ngFor="let tile of tiles; index as i">
                <div class="col py-1" *ngIf="tile.isAllowed()">
                    <ng-container *ngIf="tile.isCallbackThere">
                        <a
                            (click)="tile.invokeCallback()"
                            class="text-decoration-none"
                        >
                            <app-tile [tile]="tile"> </app-tile>
                        </a>
                    </ng-container>
                    <ng-container *ngIf="!tile.isCallbackThere">
                        <a
                            [routerLink]="tile.link"
                            class="text-decoration-none"
                        >
                            <app-tile [tile]="tile"> </app-tile>
                        </a>
                    </ng-container>
                </div>
            </ng-container>
        </div>
    `,
    styles: [``],
})
export class TileGroupsComponent implements OnInit {
    @Input()
    tiles: Tile[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private authDefaultService: AuthDefaultService,
        private tokenStorage: SessionService,
        protected permissionService: PermissionService,
    ) {
    }

    ngOnInit(): void {
    }
}
