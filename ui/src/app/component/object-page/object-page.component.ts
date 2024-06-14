import {AfterViewInit, Component, ContentChild, ContentChildren, OnInit, QueryList} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfirmationService, MessageService} from "primeng/api";
import {ObjectPageHeaderComponent} from "./object-page-header.component";
import {ObjectPageSectionComponent} from "./object-page-section.component";
import {ActivatedRoute} from "@angular/router";
import {firstValueFrom} from "rxjs";

@Component({
    selector: 'app-object-page',
    template: `
        <div class="container-fluid mb-5 px-0" *ngIf="!loading">
            <div class="card">
                <div class="container">
                    <div class="row">
                        <div class="col">
                            <ng-container [ngTemplateOutlet]="header.template"></ng-container>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col">
                            <ul class="nav nav-tabs">
                                <li class="nav-item " *ngFor="let section of sections">
                                    <button class="nav-link nav-tab-btn text-uppercase px-0 me-4"
                                            type="button" (click)="doScroll(section.name.toUpperCase())">
                                        <strong>{{ section.name }} </strong>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container">
                <div class="" *ngFor="let section of sections">
                    <div class="row my-4" id="{{section.name.toUpperCase()}}">
                        <div class="col-md-12 ">
                            <span class="h4 text-capitalize">{{ section.name }}</span>
                        </div>
                    </div>
                    <div class="row my-2">
                        <div class="col-md-12 ">
                            <div class="card">
                                <div class="">
                                    <ng-container [ngTemplateOutlet]="section.template"></ng-container>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="text-center" *ngIf="loading">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    `,
    styles: [`
        .nav-tab-btn:focus {
            border-bottom: 0.25rem solid blue
        }
    `],
    providers: []
})
export class ObjectPageComponent implements OnInit, AfterViewInit {

    loading = true;

    @ContentChild(ObjectPageHeaderComponent)
    header!: ObjectPageHeaderComponent;

    @ContentChildren(ObjectPageSectionComponent)
    sections!: QueryList<ObjectPageSectionComponent>;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private actRoute: ActivatedRoute,
        private modalService: NgbModal) {
    }

    async ngOnInit() {
        this.loading = true;
        this.loading = false;
    }

    async ngAfterViewInit(): Promise<void> {
        const fragment = await firstValueFrom(this.actRoute.fragment);
        if (fragment) {
            setTimeout(() => this.doScroll(fragment.toUpperCase()), 500);
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
