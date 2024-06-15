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
import {FilterMatchMode, LazyLoadEvent} from "primeng/api";
import {Table} from "primeng/table"
import {TableColumnComponent} from "./app-table-column.component";
import {Util} from "../utils";


export class TableAsyncLoadEvent {
    pageNo!: number;
    pageSize!: number;
    sortBy!: any[];
    filters!: any[];
    update!: (data: any[]) => void;
}


@Component({
    selector: 'app-table',
    template: `
        <p-table
            [(selection)]="selectedItem"
            [scrollable]="true"
            scrollHeight="{{scrollHeight}}"
            [lazy]="true"
            (onLazyLoad)="lazyLoad($event)"
            [dataKey]="idField"
            [rowHover]="true"
            [value]="actualRows"
            selectionMode="{{ multi ? 'multiple' : 'single' }}"
            [virtualRowHeight]="20"
            [virtualScroll]="true"
            styleClass="p-datatable-gridlines p-datatable-sm"
        >
            <!--                <ng-template pTemplate="caption">-->

            <!--                </ng-template>-->
            <ng-template pTemplate="header">
                <tr style="height:40px">
                    <th style="max-width:40px">
                        <p-tableHeaderCheckbox *ngIf="multi"></p-tableHeaderCheckbox>
                    </th>
                    <ng-container *ngFor="let col of columns">
                        <ng-container *ngIf="col.isTemplateProvided" [ngTemplateOutlet]="col.template"></ng-container>
                        <ng-container *ngIf="!col.isTemplateProvided">
                            <th>
                                {{ col.label }}
                            </th>
                        </ng-container>

                    </ng-container>
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
    `,
    styles: [''],
})
export class AppTableComponent implements OnInit {

    @Input() scrollHeight: string = "65vh";
    @Input() idField!: string;
    @Input() multi: string | boolean = true;
    @Input() isFilterAsync: string | boolean = false;
    @Input() filters: Filter[] = [];

    @Input() selection: any[] = [];
    @Output() selectionChange: EventEmitter<any[]> = new EventEmitter();

    @Output() onLoad: EventEmitter<TableAsyncLoadEvent> = new EventEmitter();

    @ContentChild('table_body')
    body: TemplateRef<any> | null = null;

    actualRows: any[] = [];

    @ContentChildren(TableColumnComponent)
    columns!: QueryList<TableColumnComponent>;

    @ViewChild(FilterBarComponent)
    filterBar!: FilterBarComponent;

    @ViewChild(Table)
    pTable!: Table;

    pageNo: number = 0;


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
        if (typeof this.isFilterAsync === 'string') {
            this.isFilterAsync = Util.parseBoolean(this.isFilterAsync);
        }
        if (typeof this.multi === 'string') {
            this.multi = Util.parseBoolean(this.multi);
        }
    }

    setData(data: any[]) {
        this.pageNo = 0;
        this.actualRows = data;
    }

    appendData(data: any[]) {
        this.pageNo += 1;
        // this.actualRows.push(...data);
        this.actualRows = [...this.actualRows, ...data];
    }

    lazyLoad(event: LazyLoadEvent) {
        console.log("lazy", event);
        this.onLoad.emit({
            pageNo: this.pageNo,
            pageSize: 10,
            sortBy: [],
            filters: this.filters,
            update: this.appendData.bind(this)
        })
    }

    filter(filters: Filter[]) {
        this.filters = filters;
        if (this.isFilterAsync) {
            this.onLoad.emit({
                pageNo: this.pageNo,
                pageSize: 100,
                sortBy: [],
                filters: filters,
                update: this.setData.bind(this)
            })
        } else {
            if (Object.keys(filters).length > 0) {
                console.log(filters);
                this.pTable.clearState()
                for (let filter of filters) {
                    let value = filter.value;
                    let pattern = new RegExp(value, 'iug');
                    this.pTable.filter(value, filter.name, FilterMatchMode.CONTAINS);
                }
            }
        }

    }
}
