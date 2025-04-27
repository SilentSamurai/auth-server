import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {Util} from "../util/utils";


@Component({
    selector: 'app-table-col',
    template: `
        <ng-template #TBCLCH>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [],
})
export class TableColumnComponent implements OnInit {

    @Input() label: string = '';
    @Input() name: string = '';

    @Input() isId: string | boolean = false;

    isTemplateProvided: boolean = false;

    @ViewChild('TBCLCH', {static: true}) template!: TemplateRef<any>;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
        if (typeof this.isId === 'string') {
            this.isId = Util.parseBoolean(this.isId);
        }
        if (this.label.length <= 0 && this.name.length <= 0) {
            this.isTemplateProvided = true;
        }
    }
}
