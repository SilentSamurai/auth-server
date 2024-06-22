import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";

@Component({
    selector: 'app-dialog-tab',
    template: `
        <ng-template #SDTB>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [],
})
export class DialogTabComponent implements OnInit {

    @Input() name: string = '';

    @ViewChild('SDTB', {static: true}) template!: TemplateRef<any>;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
    }

}
