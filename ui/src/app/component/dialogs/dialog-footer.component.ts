import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';

@Component({
    selector: 'app-dialog-footer',
    template: `
        <ng-template #SDFT>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [],
})
export class DialogFooterComponent implements OnInit {
    @ViewChild('SDFT', {static: true}) template!: TemplateRef<any>;

    constructor() {}

    async ngOnInit(): Promise<void> {}
}
