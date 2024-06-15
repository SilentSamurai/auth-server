import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {AuthDefaultService} from "../../_services/auth.default.service";

@Component({
    selector: 'app-launchpad',
    template: `
        <div class="container-fluid bg-white py-1 px-4">
            <ul class="nav nav-tabs nav-tab-btn ">
                <li class="nav-item " *ngFor="let group of internalGroups">
                    <button class="nav-link nav-tab-btn text-capitalize px-0 me-4"
                            type="button" (click)="doScroll(group.id)">
                        <strong>{{ group.navName }} </strong>
                    </button>
                </li>
            </ul>
        </div>

        <div class="container-fluid mt-2 mb-5">
            <div *ngFor="let group of internalGroups" class="mx-4">
                <div class="h3 mx-2 my-3 text-capitalize" id="{{group.id}}">{{ group.groupName }}</div>
                <app-tile-group [tiles]="group.tiles">
                </app-tile-group>
            </div>
        </div>
    `,
    styles: [`
        .nav-tab-btn:focus {
            border-bottom: 0.25rem solid blue
        }

        .nav-tab-btn {
            border-bottom: 0.25rem solid white;
        }
    `]
})
export class LaunchPadComponent implements OnInit {

    @Input()
    groups: any;

    internalGroups: any[] = [];

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private tokenStorage: TokenStorageService) {
    }


    ngOnInit(): void {
        for (let group of this.groups) {
            if (group.name == "") {
                this.internalGroups.push({
                    groupName: "",
                    navName: "My Home",
                    id: "my-home",
                    tiles: group.tiles
                });
            } else {
                this.internalGroups.push({
                    groupName: group.name,
                    navName: group.name,
                    id: group.name,
                    tiles: group.tiles
                });
            }
        }
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
