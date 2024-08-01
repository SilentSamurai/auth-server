import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";


@Component({
    selector: 'app-table-btn',
    template: `
        <ng-template #APPTBC>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [],
})
export class AppTableButtonComponent implements OnInit {

    @ViewChild('APPTBC', {static: true}) template!: TemplateRef<any>;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
    }
}
