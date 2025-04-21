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
    @Input() field: string = '';
    @Input() width?: number;
    @Input() isId: string | boolean = false;
    @Input() isTemplateProvided: boolean = false;
    @Input() template?: TemplateRef<any>;
    @Input() sortable: boolean = true;

    @ViewChild('TBCLCH', {static: true}) templateRef!: TemplateRef<any>;

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
