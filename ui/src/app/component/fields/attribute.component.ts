import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-attribute',
    template: `
        <div class="row mb-2">
            <span class="col-md-auto p-disabled pe-0 fw-semibold"
            >{{ label }}:</span
            >
            <span class=" col-md-auto fw-semibold {{ valueClass }}">
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
