import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-attribute',
    template: `
        <div class="row mb-2 py-1">
            <span class="col-auto col-md-4 p-disabled fw-semibold text-end "
            >{{ label }}:</span
            >
            <span class="col-auto col-md-8 fw-semibold {{ valueClass }}">
                <ng-content></ng-content>
            </span>
        </div>
    `,
    styles: [],
})
export class AttributeComponent implements OnInit {
    @Input() label: string = '';
    @Input() value: string = '';
    @Input() valueClass: string = '';

    constructor() {
    }

    async ngOnInit(): Promise<void> {
    }
}
