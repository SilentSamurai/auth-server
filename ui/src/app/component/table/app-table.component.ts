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
import {Table, TableLazyLoadEvent} from "primeng/table"
import {TableColumnComponent} from "./app-table-column.component";
import {Util} from "../utils";
import {AppTableButtonComponent} from "./app-table-button.component";


export class TableAsyncLoadEvent {
    pageNo!: number;
    pageSize!: number;
    sortBy!: any[];
    filters!: any[];
    update!: (data: any[], isNextPageAvailable: boolean) => void;
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
            [loading]="loading"
            [value]="actualRows"
            [selectionMode]="multi ? 'multiple' : 'single' "
            [virtualScrollItemSize]="20"
            [virtualScroll]="true"
            styleClass="p-datatable-striped p-datatable-sm"
        >
            <ng-template pTemplate="caption">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        {{ title }}
                    </div>
                    <div>
                        <ng-container *ngFor="let btnTmpl of buttons">
                            <ng-container [ngTemplateOutlet]="btnTmpl.template"></ng-container>
                        </ng-container>
                        <button type="button" class="btn btn-sm " (click)="reset()" pRipple>
                            <i class="pi pi-refresh "></i>
                        </button>
                        <button type="button" class="btn btn-sm ps-2" (click)="reset()" pRipple>
                            <i class="pi pi-sort-alt "></i>
                        </button>
                    </div>
                </div>

            </ng-template>
            <ng-template pTemplate="header">
                <tr style="min-height:35px">
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
                <tr style="height:35px">
                    <td style="max-width:40px">
                        <p-tableCheckbox [value]="row"></p-tableCheckbox>

                        <!--                        <p-tableRadioButton *ngIf="!multi" [value]="row" ></p-tableRadioButton>-->
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

    loading: boolean = false;

    @Input() title: string = "";
    @Input() scrollHeight: string = "65vh";
    @Input() idField!: string;
    @Input() multi: string | boolean = true;
    @Input() isFilterAsync: string | boolean = false;
    @Input() filters: Filter[] = [];

    @Input() selection: any[] = [];
    @Output() selectionChange: EventEmitter<any[]> = new EventEmitter();

    @Output() onDataRequest: EventEmitter<TableAsyncLoadEvent> = new EventEmitter();

    @ContentChild('table_body')
    body: TemplateRef<any> | null = null;

    actualRows: any[] = [];

    @ContentChildren(TableColumnComponent)
    columns!: QueryList<TableColumnComponent>;

    @ContentChildren(AppTableButtonComponent)
    buttons!: QueryList<AppTableButtonComponent>;

    @ViewChild(FilterBarComponent)
    filterBar!: FilterBarComponent;

    @ViewChild(Table)
    pTable!: Table;

    pageNo: number = -1;
    isLastPageReached: boolean = false;
    private sortBy: any[] = [];


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

    // getIdFieldData(row: any, index: any) {
    //     if (this.idField) {
    //         return row[this.idField];
    //     } else {
    //         return index;
    //     }
    // }

    setData(data: any[], isNextPageAvailable: boolean) {
        this.pageNo = 0;
        this.isLastPageReached = !isNextPageAvailable;
        this.actualRows = data;
    }

    appendData(data: any[], isNextPageAvailable: boolean) {
        if (data.length > 0) {
            // this.actualRows.push(...data);
            this.actualRows = [...this.actualRows, ...data];
            this.pageNo += 1;
        }
        this.isLastPageReached = !isNextPageAvailable;
    }

    requestForData(options: any) {
        this.filters = options.filters || this.filters;
        this.sortBy = options.sortBy || this.sortBy;
        this.pageNo = options.pageNo || this.pageNo;
        if (options.append === false) {
            this.pageNo = 0;
            this.isLastPageReached = false;
        }
        // const timeout = setTimeout(() => this.loading = false, 5 * 60 * 1000);
        const eventObj = {
            pageNo: options.append === true ? this.pageNo + 1 : this.pageNo,
            pageSize: 30,
            sortBy: this.sortBy,
            filters: this.filters,
            update: (data: any[], isNextPageAvailable: boolean) => {
                if (options.append === true) {
                    this.appendData(data, isNextPageAvailable);
                } else {
                    this.setData(data, isNextPageAvailable);
                }
                this.loading = false;
            }
        }
        this.loading = true;
        this.onDataRequest.emit(eventObj);

    }

    lazyLoad(event: TableLazyLoadEvent) {
        console.log("lazy", event);
        if (!this.isLastPageReached && !this.loading) {
            this.requestForData({append: true})
        }
    }

    filter(filters: Filter[]) {
        if (this.isFilterAsync) {
            this.requestForData({pageNo: 0, filters, append: false});
        } else {
            // if (filters.length > 0) {
            //     console.log(filters);
            //     this.pTable.clearState();
            //     for (let filter of filters) {
            //         let value = filter.value;
            //         this.pTable.filter(value, filter.name, FilterMatchMode.CONTAINS);
            //     }
            // }
        }

    }

    reset() {
        this.requestForData({pageNo: 0, append: false});
    }
}
