import {
    Component,
    ContentChild,
    ContentChildren,
    EventEmitter,
    Input,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {Filter, FilterBarComponent} from "../filter-bar/filter-bar.component";
import {LazyLoadEvent} from "primeng/api";


export class TableAsyncLoadEvent {
    filters: any;
    update!: (data: any[]) => void;
}

function parseBoolean(value: string): boolean {
    const lowerCaseStr = value.toLowerCase();
    return lowerCaseStr === 'true';
}

@Component({
    selector: 'app-table-col',
    template: '',
    styles: [],
})
export class TableColumnComponent implements OnInit {

    @Input() label: string = '';
    @Input() name: string = '';
    @Input() isId: string | boolean = false;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
        if (typeof this.isId === 'string') {
            this.isId = parseBoolean(this.isId);
        }
    }

}

@Component({
    selector: 'app-table',
    template: `
        <div class="row pt-0 " *ngIf="enableFilter">
            <div class="col">
                <app-fb (onFilter)="filter($event)">
                    <app-fb-col *ngFor="let col of columns"
                                name="{{col.name}}"
                                label="{{col.label}}">
                    </app-fb-col>
                </app-fb>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <p-table
                    [(selection)]="selectedItem"
                    [scrollable]="true"
                    (onLazyLoad)="lazyLoad($event)"
                    [dataKey]="idField"
                    [lazy]="true"
                    [rowHover]="true"
                    [value]="filteredRow"
                    selectionMode="{{ multi ? 'multiple' : 'single' }}"
                    [virtualRowHeight]="40"
                    [virtualScroll]="true"
                    scrollHeight="65vh"
                    styleClass="p-datatable-gridlines p-datatable-sm"
                >
                    <!--                <ng-template pTemplate="caption">-->

                    <!--                </ng-template>-->
                    <ng-template pTemplate="header">
                        <tr style="height:40px">
                            <th style="max-width:40px">
                                <p-tableHeaderCheckbox *ngIf="multi"></p-tableHeaderCheckbox>
                            </th>
                            <th *ngFor="let col of columns">
                                {{ col.label }}
                            </th>
                        </tr>
                    </ng-template>
                    <ng-template let-row let-rowIndex="rowIndex" pTemplate="body">
                        <tr [pSelectableRow]="row">
                            <td style="max-width:40px">
                                <p-tableCheckbox [value]="row"></p-tableCheckbox>
                            </td>
                            <ng-container *ngTemplateOutlet="body; context: {$implicit: row}"></ng-container>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="loadingbody">
                        <tr style="height:40px">
                            <td *ngFor="let col of columns">
                                <div class="loading-text"></div>
                                <p-skeleton [ngStyle]="{'width': '100%'}"></p-skeleton>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="footer">

                    </ng-template>
                </p-table>
            </div>
        </div>
    `,
    styles: [],
})
export class TableComponent implements OnInit {

    @Input() enableFilter: string | boolean = true;
    @Input() idField!: string;
    @Input() multi: string | boolean = true;
    @Input() isFilterAsync: string | boolean = false;

    @Input() selection: any[] = [];
    @Output() selectionChange: EventEmitter<any[]> = new EventEmitter();
    @Output() onLoad: EventEmitter<TableAsyncLoadEvent> = new EventEmitter();
    @ContentChild('table_body')
    body: TemplateRef<any> | null = null;
    actualRows: any[] = [];
    filteredRow: any[] = [];
    @ContentChildren(TableColumnComponent)
    columns!: QueryList<TableColumnComponent>;
    @ViewChild(FilterBarComponent)
    filterBar!: FilterBarComponent;

    constructor() {
    }

    get selectedItem() {
        return this.selection;
    }

    set selectedItem(selection: any[] | any) {
        if (Array.isArray(selection)) {
            this.selection = selection;
            this.selectionChange.emit(this.selection);
        } else {
            this.selection = [selection];
            this.selectionChange.emit(this.selection);
        }
    }

    async ngOnInit(): Promise<void> {
        if (typeof this.enableFilter === 'string') {
            this.enableFilter = parseBoolean(this.enableFilter);
        }
        if (typeof this.isFilterAsync === 'string') {
            this.isFilterAsync = parseBoolean(this.isFilterAsync);
        }
        if (typeof this.multi === 'string') {
            this.multi = parseBoolean(this.multi);
        }
    }

    lazyLoad(event: LazyLoadEvent) {
        console.log("lazy", event);
        this.onLoad.emit({
            filters: this.filterBar.getFilters(),
            update: this.updateVirtualData.bind(this)
        })
    }

    updateVirtualData(data: any[]) {
        this.actualRows = data;
        this.filteredRow = this.actualRows;
    }

    filter(filters: Filter[]) {
        if (this.isFilterAsync) {
            this.onLoad.emit({
                filters: filters,
                update: this.updateVirtualData.bind(this)
            })
        } else {
            if (Object.keys(filters).length > 0) {
                console.log(filters);
                const filtered = this.actualRows.filter((row, index) => {
                    for (let filter of filters) {
                        let value = filter.value;
                        let pattern = new RegExp(value, 'iug');
                        if (row.hasOwnProperty(filter.name) && pattern.test(row[filter.name])) {
                            return true;
                        }
                    }
                    return false;
                });
                this.filteredRow = filtered;
            }
        }

    }
}
