import {
    Component,
    ContentChild,
    ContentChildren,
    EventEmitter,
    Input,
    OnInit,
    Output,
    QueryList,
    TemplateRef
} from '@angular/core';
import {ValueHelpComponent, ValueHelpResult} from "../value-help/value-help.component";
import {DataModel, DataSource} from "../model/DataModel";
import {ValueHelpColumnComponent} from "../value-help-input/value-help-column.component";
import {FilterBarColumnComponent} from "../filter-bar/filter-bar.component";
import {ModalResult, ModalService} from "../dialogs/modal.service";


@Component({
    selector: 'app-value-help-button',
    template: `
        <button type="button" class="btn {{classStyle}}" (click)="openValueHelp()">
            <ng-content select="app-btn-content"></ng-content>
        </button>
    `,
    styles: []
})
export class ValueHelpButtonComponent implements OnInit {


    @Input({required: true}) dataSource!: DataSource<any>;

    @Input() multi: boolean = false;
    @Input() classStyle: string = "";

    @Input() name: string = 'Value Help';

    @Input() selection: any[] = [];

    @Output() onOpen = new EventEmitter<ValueHelpResult>();
    @Output() onClose = new EventEmitter<ValueHelpResult>();


    @ContentChild('vh_body') body: TemplateRef<any> | null = null;

    @ContentChildren(ValueHelpColumnComponent) columns!: QueryList<ValueHelpColumnComponent>;
    @ContentChildren(FilterBarColumnComponent) filters!: QueryList<FilterBarColumnComponent>;

    constructor(private modalService: ModalService) {
    }

    ngOnInit(): void {
        // Ensure dataModel is provided
        if (!this.dataSource) {
            console.warn('ValueHelpButtonComponent requires a valid dataModel input.');
        }
    }

    async openValueHelp(): Promise<void> {
        this.onOpen.emit();

        const modalResult: ModalResult<ValueHelpResult> = await this.modalService.open(ValueHelpComponent, {
            initData: {
                body: this.body,
                columns: this.columns,
                filters: this.filters,
                dataModel: this.dataSource,
                name: this.name,
                selectedItem: this.selection,
                multi: this.multi
            }
        });

        if (modalResult.is_ok()) {
            const valueHelpResult = modalResult.data as ValueHelpResult;
            this.onClose.emit(modalResult.data);
        }
    }
}
