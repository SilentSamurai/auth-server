import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";

@Component({
    selector: 'app-dialog-actions',
    template: `
        <ng-template #SDA>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [],
})
export class DialogActionsComponent implements OnInit {

    @ViewChild('SDA', {static: true}) template!: TemplateRef<any>;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
    }

}
