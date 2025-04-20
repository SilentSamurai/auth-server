import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {PermissionService, Actions, Subjects} from "../../_services/permission.service";
import {TileGroup} from "./models";

@Component({
    selector: 'app-launchpad',
    template: `
        <div class="container-fluid bg-white mb-2 px-4 shadow-sm">
            <ul class="nav nav-tabs nav-tab-btn ">
                <ng-container *ngFor="let group of groups">
                    <li class="nav-item " *ngIf="group.hasVisibleTile()">
                        <button class="nav-link nav-tab-btn text-capitalize"
                                type="button" (click)="doScroll(group.id)" id="{{group.id}}_HOME_NAV">
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
                    <div class="h3 mx-2 my-3 text-capitalize" id="{{group.id}}">{{ group.groupName }}</div>
                    <app-tile-group [tiles]="group.tiles">
                    </app-tile-group>
                </ng-container>
            </div>
        </div>
    `,
    styles: [`
        .nav-tab-btn:focus {
            border-bottom: 0.25rem solid blue
        }

        .nav-tab-btn {
            border-bottom: 0.25rem ;
        }
    `]
})
export class LaunchPadComponent implements OnInit {

    @Input()
    groups: TileGroup[] = [];

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private tokenStorage: TokenStorageService,
                protected permissionService: PermissionService) {
    }

    ngOnInit(): void {

    }

    doScroll(elementId: string) {
        try {
            console.log("scrolling to", elementId);
            let elements = document.getElementById(elementId);
            elements?.scrollIntoView();
        } finally {
        }
    }
}
