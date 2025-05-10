import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';

@Component({
    selector: 'app-input-error',
    template: `
        <ng-template #INPERR>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [],
})
export class InputErrorComponent implements OnInit {
    @Input() field: string = '';
    @ViewChild('INPERR', {static: true}) template!: TemplateRef<any>;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
    }
}
