import {Component, Input, OnInit, TemplateRef, ViewChild,} from '@angular/core';

@Component({
    selector: 'app-op-section',
    template: `
        <div class="row my-4" id="{{ name.toUpperCase() }}">
            <div class="col-md-8">
                <span class="h4 text-capitalize">{{ name }}</span>
            </div>
            <div class="col-md-4 d-flex justify-content-end">
                <ng-content select="app-section-action"></ng-content>
            </div>
        </div>
        <div class="row my-2">
            <div class="col-md-12 ">
                <ng-content select="app-section-content"></ng-content>
            </div>
        </div>
    `,
    styles: [''],
    providers: [],
})
export class ObjectPageSectionComponent implements OnInit {
    @Input() name: string = '';

    loading = true;

    @ViewChild('OPSC', {static: true}) template!: TemplateRef<any>;

    constructor() {
    }

    async ngOnInit() {
        this.loading = true;
        this.loading = false;
    }
}
