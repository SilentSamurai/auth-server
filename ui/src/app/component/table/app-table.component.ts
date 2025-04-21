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
import {FilterBarComponent} from "../filter-bar/filter-bar.component";
import {TableColumnComponent} from "./app-table-column.component";
import {Util} from "../util/utils";
import {AppTableButtonComponent} from "./app-table-button.component";
import {DataModel, DataPushEvent, DataPushEventStatus, Query} from "../model/DataModel";
import {Filter} from "../model/Filters";
import {CheckboxChangeEvent} from "primeng/checkbox";


export class TableAsyncLoadEvent extends Query {

}


@Component({
    selector: 'app-table',
    template: `
        <div class="a-table-caption h6 p-2 mb-0 border-bottom">
            <div class="d-flex align-items-center justify-content-between">
                <div class="app-table-body">
                    {{ title }} <span>({{ dataModel.totalRowCount() }})</span>
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
        </div>
        <div class="table-responsive" style="max-height: {{scrollHeight}}" (scroll)="lazyLoad($event)">
            <table class="table a-table">
                <thead class="sticky-top top-0">
                <tr style="min-height:35px">
                    <th style="width:40px">
                        <p-checkbox *ngIf="multi"
                                    [binary]="true"
                                    [(ngModel)]="_selectAll"
                                    (onChange)="onSelectAll($event)"></p-checkbox>
                    </th>
                    <ng-container *ngFor="let col of columns">
                        <ng-container *ngIf="col.isTemplateProvided" [ngTemplateOutlet]="col.template"></ng-container>
                        <ng-container *ngIf="!col.isTemplateProvided">
                            <th scope="col">
                                {{ col.label }}
                            </th>
                        </ng-container>

                    </ng-container>
                </tr>
                </thead>
                <tbody>
                <tr class="a-table-row" style="height:35px" *ngFor="let row of actualRows">
                    <td style="width:40px">
                        <p-checkbox *ngIf="multi"
                                    [value]="getKeyValue(row)"
                                    [(ngModel)]="selectedItem"></p-checkbox>

                        <p-radioButton *ngIf="!multi"
                                       name="table_input"
                                       [value]="getKeyValue(row)"
                                       [(ngModel)]="selectedItem"></p-radioButton>
                    </td>
                    <ng-container *ngTemplateOutlet="body; context: {$implicit: row}"></ng-container>
                </tr>
                <tr style="height:40px" *ngIf="loading">
                    <td>
                        <div class="loading-text"></div>
                        <p-skeleton [ngStyle]="{'width': '100%'}"></p-skeleton>
                    </td>
                    <td *ngFor="let col of columns">
                        <div class="loading-text"></div>
                        <p-skeleton [ngStyle]="{'width': '100%'}"></p-skeleton>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

    `,
    styles: [`
        .a-table-caption {
            background-color: var(--bs-card-bg);
            color: var(--bs-body-color, #212529);
            border-color: var(--bs-border-color);
        }

        .a-table {
            color: var(--bs-body-color);
        }

        .a-table thead th {
            background-color: var(--bs-card-bg);
            color: var(--bs-body-color);
            border-color: var(--bs-border-color);
        }

        .a-table tbody td {
            border-color: var(--bs-border-color);
        }

        .a-table-row:hover {
            background-color: var(--bs-table-hover-bg, rgba(var(--bs-primary-rgb, 13, 110, 253), 0.05));
        }

        .a-table-row.selected {
            background-color: var(--bs-table-active-bg, rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1));
        }

        .btn-sm {
            color: var(--bs-body-color);
        }

        /* Dark mode specific styles */
        [data-bs-theme="dark"] {
            .a-table-caption {
                background-color: var(--bs-dark);
                color: var(--bs-light);
                border-color: var(--bs-border-color);
            }

            .a-table {
                color: var(--bs-light);
            }

            .a-table thead th {
                background-color: var(--bs-dark);
                color: var(--bs-light);
                border-color: var(--bs-border-color);
            }

            .a-table tbody td {
                border-color: var(--bs-border-color);
            }

            .a-table-row:hover {
                background-color: var(--bs-table-hover-bg, rgba(255, 255, 255, 0.075));
            }

            .a-table-row.selected {
                background-color: var(--bs-table-active-bg, rgba(255, 255, 255, 0.1));
            }

            .btn-sm {
                color: var(--bs-light);
            }
        }
    `]
})
// Table for reuse
export class AppTableComponent implements OnInit {

    loading: boolean = false;

    _dataModel!: DataModel;

    @Input({required: true})
    set dataModel(dataModel: DataModel) {
        this._dataModel = dataModel;
        this.idFields = dataModel.getKeyFields();
        this._dataModel.dataPusher().subscribe(this.dataPushEventHandler.bind(this))
    }

    get dataModel(): DataModel {
        return this._dataModel
    }

    @Input() title: string = "";
    @Input() scrollHeight: string = "65vh";
    @Input() multi: string | boolean = true;

    @Input() selection: any[] = [];
    @Output() selectionChange: EventEmitter<any[]> = new EventEmitter();

    @ContentChild('table_body')
    body: TemplateRef<any> | null = null;

    actualRows: any[] = [];

    @ContentChildren(TableColumnComponent)
    columns!: QueryList<TableColumnComponent>;

    @ContentChildren(AppTableButtonComponent)
    buttons!: QueryList<AppTableButtonComponent>;

    @ViewChild(FilterBarComponent)
    filterBar!: FilterBarComponent;

    _selectAll: boolean = false;

    protected nextPageNo: number = 0;
    private sortBy: any[] = [];
    protected idFields: string[] = [];

    protected pagesLoaded = new Set();
    protected pagesInProgress = new Set();
    protected _selectedKeys: string[] | null = null;


    constructor() {

    }

    async ngOnInit(): Promise<void> {
        if (typeof this.multi === 'string') {
            this.multi = Util.parseBoolean(this.multi);
        }

        this.reset();
    }

    getKeyValue(row: any) {
        return this.idFields.map(kf => row[kf].toString())
            .reduce((a, b) => a + b, "");
    }

    get selectedItem() {
        if (!this._selectedKeys) {
            this._selectedKeys = this.selection.map(this.getKeyValue.bind(this));
        }
        return this._selectedKeys
    }

    set selectedItem(selectedKeys: any[] | any) {
        this._selectedKeys = selectedKeys;
        if (Array.isArray(selectedKeys)) {
            const keysSet = new Set(selectedKeys);
            this.selection = this.actualRows.filter(
                item => keysSet.has(this.getKeyValue(item))
            )
            this.selectionChange.emit(this.selection);
        } else {
            this.selection = this.actualRows.filter(
                item => this.getKeyValue(item) === selectedKeys
            )
            this.selectionChange.emit(this.selection);
        }
    }

    onSelectAll($event: CheckboxChangeEvent) {
        if ($event.checked) {
            this._selectAll = true;
            this.selectedItem = this.actualRows;
        } else {
            this._selectAll = false;
            this.selectedItem = [];
        }
    }

    dataPushEventHandler(event: DataPushEvent) {
        switch (event.operation) {
            case DataPushEventStatus.UPDATED_DATA:
                if (event.srcOptions.append === true) {
                    this.appendData(event.data!, event.pageNo!);
                }
                if (event.srcOptions.append === false) {
                    this.setData(event.data!);
                }
        }
    }

    protected setData(data: any[]) {
        this.nextPageNo = 1;
        this.pagesInProgress.clear();
        this.pagesLoaded.clear();
        // this.isLastPageReached = !isNextPageAvailable;
        this.pagesLoaded.add(0);
        this.actualRows = data;
    }

    protected appendData(data: any[], pageNo: number) {
        this.pagesInProgress.delete(pageNo);
        if (!this.pagesLoaded.has(pageNo)) {
            this.pagesLoaded.add(pageNo);
            if (data.length > 0) {
                // this.actualRows.push(...data);
                this.actualRows = [...this.actualRows, ...data];
                this.nextPageNo += 1;
            }
        }
        // this.isLastPageReached = !isNextPageAvailable;
    }

    protected async requestForData(options: any) {
        this.sortBy = options.sortBy || this.sortBy;
        this.nextPageNo = options.pageNo || this.nextPageNo;
        if (options.append === false) {
            // reset next page no
            this.nextPageNo = 0;
        }
        if (this.dataModel.hasPage(this.nextPageNo) &&
            !this.pagesLoaded.has(this.nextPageNo) && !this.pagesInProgress.has(this.nextPageNo)) {
            this.dataModel.pageNo(this.nextPageNo)
            this.dataModel.orderBy(this.sortBy);
            if (options.filters && options.filters.length > 0) {
                this.dataModel.filter(options.filters)
            }
            this.pagesInProgress.add(this.nextPageNo);
            await this.dataModel.apply(options);
        }

    }

    lazyLoad(event: any) {
        // console.log("lazy", event);
        const reachedEnd = event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight - 1;
        // console.log(reachedEnd, event.target.offsetHeight + event.target.scrollTop, event.target.scrollHeight);
        if (reachedEnd && this.pagesInProgress.size < 1) {
            console.log("lazy", event);
            this.requestForData({append: true})
        }

    }

    filter(filters: Filter[]) {
        this.pagesInProgress.clear();
        this.pagesLoaded.clear();
        this.requestForData({pageNo: 0, filters, append: false});
    }

    reset() {
        this.pagesInProgress.clear();
        this.pagesLoaded.clear();
        this.requestForData({pageNo: 0, append: false});
    }


}
