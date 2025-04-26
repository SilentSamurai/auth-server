import {
    AfterViewInit,
    booleanAttribute,
    Component,
    ContentChildren,
    Input,
    OnInit,
    QueryList,
} from '@angular/core';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ActivatedRoute, Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {ObjectPageTabComponent} from './object-page-tab.component';

@Component({
    selector: 'app-object-page',
    template: `
        <div class="container-fluid mb-5 px-0 main-container" *ngIf="!loading">
            <div class="card shadow-sm" style="border-radius: 0">
                <div class="container mt-4">
                    <div class="row">
                        <div class="col mb-4">
                            <div
                                class="d-flex align-items-center justify-content-between"
                            >
                                <div>
                                    <div class="h3 text-primary">
                                        <ng-content
                                            select="app-op-title"
                                        ></ng-content>
                                    </div>
                                    <div class="h6 text-secondary">
                                        <ng-content
                                            select="app-op-subtitle"
                                        ></ng-content>
                                    </div>
                                </div>

                                <div class="d-flex justify-content-end">
                                    <ng-content
                                        select="app-op-actions"
                                    ></ng-content>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <ng-content select="app-op-header"></ng-content>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col">
                            <ul
                                class="nav flex-nowrap overflow-x-auto overflow-y-hidden"
                            >
                                <li class="nav-item" *ngFor="let tab of tabs">
                                    <button
                                        class="nav-link text-uppercase"
                                        [class.nav-tab-btn]="currentTab === tab"
                                        [attr.aria-current]="
                                            currentTab === tab ? 'page' : null
                                        "
                                        id="{{
                                            tab.name.toUpperCase()
                                        }}_SECTION_NAV"
                                        (click)="onNavButtonClick(tab)"
                                    >
                                        <strong>{{ tab.name }}</strong>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container flex-fill content-area">
                <ng-container *ngIf="singlePage">
                    <div
                        *ngFor="let tab of tabs"
                        id="{{ tab.name.toUpperCase() }}"
                    >
                        <ng-container
                            [ngTemplateOutlet]="tab.template"
                        ></ng-container>
                    </div>
                </ng-container>
                <ng-container *ngIf="!singlePage && currentTab">
                    <ng-container
                        [ngTemplateOutlet]="currentTab.template"
                    ></ng-container>
                </ng-container>
            </div>
        </div>

        <div class="text-center" *ngIf="loading">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: flex;
                flex-direction: column;
                height: 100vh;
            }

            .main-container {
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
                overflow: hidden;
            }

            .content-area {
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
                overflow: auto;
            }

            .nav-tabs {
                scrollbar-width: thin;
                -ms-overflow-style: none;
            }

            .nav-tabs::-webkit-scrollbar {
                display: none;
            }

            .nav-tab-btn {
                border: none;
                background: none;
                position: relative;
                white-space: nowrap;
            }

            .nav-tab-btn:after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 0.25rem;
                background: transparent;
                transition: background-color 0.2s;
            }

            .nav-tab-btn[aria-current='page']:after,
            .nav-tab-btn:hover:after {
                background: var(--bs-primary);
            }

            .nav-tab-btn:focus-visible {
                outline: 2px solid var(--bs-primary);
                outline-offset: 2px;
            }

            .card-body {
                padding: 1.5rem;
            }
        `,
    ],
    providers: [],
})
export class ObjectPageComponent implements OnInit, AfterViewInit {
    loading = true;
    @Input({transform: booleanAttribute}) singlePage = false;

    @ContentChildren(ObjectPageTabComponent, {descendants: true})
    tabs!: QueryList<ObjectPageTabComponent>;

    currentTab: ObjectPageTabComponent | undefined;

    constructor(
        private router: Router,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private actRoute: ActivatedRoute,
    ) {}

    async ngOnInit() {
        this.loading = true;
        this.loading = false;
    }

    async ngAfterViewInit(): Promise<void> {
        const fragment = await firstValueFrom(this.actRoute.fragment);
        if (fragment) {
            const ftab = this.tabs.find(
                (item) => item.name.toUpperCase() === fragment.toUpperCase(),
            );
            this.onNavButtonClick(ftab);
        } else {
            this.currentTab = this.tabs.get(0);
        }
    }

    onNavButtonClick(tab: ObjectPageTabComponent | undefined) {
        if (tab) {
            if (this.singlePage) {
                this.doScroll(tab.name.toUpperCase());
            } else {
                this.currentTab = tab;
            }
            this.updateFragment(tab.name.toUpperCase());
        }
    }

    updateFragment(fragment: string): void {
        this.router.navigate([], {fragment});
    }

    doScroll(elementId: string): void {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with ID "${elementId}" not found.`);
            return;
        }
        element.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
}
