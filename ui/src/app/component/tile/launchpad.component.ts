import {Component, Input, OnInit} from '@angular/core';
import {SessionService} from '../../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../_services/auth.service';
import {AuthDefaultService} from '../../_services/auth.default.service';
import {PermissionService} from '../../_services/permission.service';
import {TileGroup} from './models';

@Component({
    selector: 'app-launchpad',
    template: `
        <div
            class="container-fluid mb-2 px-4 shadow-sm launchpad-container sticky-top bg-body"
        >
            <ul class="nav nav-tabs nav-tab-btn ">
                <ng-container *ngFor="let group of groups">
                    <li class="nav-item " *ngIf="group.hasVisibleTile()">
                        <button
                            class="nav-link nav-tab-btn text-capitalize"
                            type="button"
                            (click)="doScroll(group.id)"
                            id="{{ group.id }}_HOME_NAV"
                        >
                            <strong class="">
                                {{ group.navName }}
                            </strong>
                        </button>
                    </li>
                </ng-container>
            </ul>
        </div>

        <div class="container-fluid mt-2 mb-5">
            <div *ngFor="let group of groups" class="mx-4">
                <ng-container *ngIf="group.hasVisibleTile()">
                    <div
                        class="h3 mx-2 my-3 text-capitalize"
                        id="{{ group.id }}"
                    >
                        {{ group.groupName }}
                    </div>
                    <app-tile-group [tiles]="group.tiles"></app-tile-group>
                </ng-container>
            </div>
        </div>
    `,
    styles: [
        `
            .launchpad-container {
                background-color: var(--bs-card-bg);
            }

            .nav-tab-btn:focus {
                border: 0;
                /*border-color: var(--bs-body-color);*/
                border-bottom: 0.25rem solid var(--bs-primary);
            }

            .nav-tab-btn {
                border: 0;
            }

            .nav-tab-btn {
                border-bottom: 0.25rem;
                color: var(--bs-body-color);
            }

            .h3 {
                color: var(--bs-body-color);
            }
        `,
    ],
})
export class LaunchPadComponent implements OnInit {
    @Input()
    groups: TileGroup[] = [];

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

    doScroll(elementId: string) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({behavior: 'smooth'});
        }
    }
}
