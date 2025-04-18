import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../../_services/user.service';
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../_services/auth.service";
import {AuthDefaultService} from "../../_services/auth.default.service";
import {PermissionService} from "../../_services/permission.service";
import {Tile} from "./models";

@Component({
    selector: 'app-tile',
    template: `
        <div class="tile"
             [ngStyle]="{width: tile.width, height: tile.height}">
            <div class="tile-title">
                <h3>{{ tile.title }}</h3>
            </div>
            <div class="tile-subtitle">
                <span>{{ tile.subtitle }}</span>
            </div>

            <!-- Spacer div to push the bottom container downward -->
            <div class="tile-spacer"></div>

            <div class="tile-bottom">
                <span class="tile-icon">
                    <i aria-hidden="true" class="fa fa-icons {{ tile.icon }} fa-2x"></i>
                </span>
                <span class="tile-information">
                    {{ tile.info }}
                </span>
            </div>
        </div>
    `,
    styles: [`
        .tile {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            min-height: 180px;
            position: relative;
        }

        .tile:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .tile-title {
            font-weight: 600;
            margin-bottom: 0.3rem;
        }

        .tile-subtitle {
            margin-bottom: 0.3rem;
            color: #666;
        }

        .tile-spacer {
            flex: 1 1 auto;
        }

        .tile-bottom {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding-top: 0.3rem;
            /*border-top: 1px solid #f0f2f3;*/
        }

        .tile-icon {
            /*color: #007bff;*/
            display: flex;
            align-items: center;
        }

        .tile-information {
            font-size: 0.95rem;
            /*color: #333;*/
        }
    `]
})
export class TileComponent implements OnInit {
    @Input() tile!: Tile;

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private tokenStorage: TokenStorageService,
                private permissionService: PermissionService) {
    }

    ngOnInit() {
    }
}
