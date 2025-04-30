import {Component, Input, OnInit} from '@angular/core';
import {SessionService} from '../../_services/session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../_services/auth.service';
import {AuthDefaultService} from '../../_services/auth.default.service';
import {Tile} from './models';
import {PermissionService} from '../../_services/permission.service';

@Component({
    selector: 'app-tile',
    template: `
        <div
            class="tile bg-body"
            [ngStyle]="{width: tile.width, height: tile.height}"
        >
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
                    <i
                        aria-hidden="true"
                        class="fa fa-icons {{ tile.icon }} fa-2x"
                    ></i>
                </span>
                <span class="tile-information">
                    {{ tile.info }}
                </span>
            </div>
        </div>
    `,
    styles: [
        `
            .tile {
                background: var(--bs-card-bg);
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
                color: var(--bs-body-color);
                border: 1px solid var(--bs-border-color);
            }

            .tile:hover {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                transform: translateY(-5px);
                border-color: var(--bs-primary);
            }

            .tile-title {
                margin-bottom: 10px;
            }

            .tile-title h3 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 600;
                color: var(--bs-body-color);
            }

            .tile-subtitle {
                color: var(--bs-secondary-color);
                font-size: 0.9rem;
                margin-bottom: 15px;
            }

            .tile-spacer {
                flex-grow: 1;
            }

            .tile-bottom {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: auto;
            }

            .tile-icon {
                color: var(--bs-primary);
            }

            .tile-information {
                font-size: 0.9rem;
                color: var(--bs-secondary-color);
            }

            [data-bs-theme='dark'] .tile {
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            [data-bs-theme='dark'] .tile:hover {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
        `,
    ],
})
export class TileComponent implements OnInit {
    @Input() tile!: Tile;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private authDefaultService: AuthDefaultService,
        private tokenStorage: SessionService,
        private permissionService: PermissionService,
    ) {
    }

    ngOnInit() {
    }
}
