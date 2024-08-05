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
import {Table, TableLazyLoadEvent} from "primeng/table"
import {TableColumnComponent} from "./app-table-column.component";
import {Util} from "../util/utils";
import {AppTableButtonComponent} from "./app-table-button.component";
import {DataModel, DataPushEvent, DataPushEvents, Query} from "../model/DataModel";
import {Filter} from "../model/Filters";


export class TableAsyncLoadEvent extends Query {

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
            selectionMode="single"
            [virtualScrollItemSize]="20"
            [virtualScroll]="true"
            styleClass="p-datatable-striped p-datatable-sm"
        >
            <ng-template pTemplate="caption">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="app-table-body">
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
// Table for reuse
export class AppTableComponent implements OnInit {

    loading: boolean = false;

    _dataModel!: DataModel;

    @Input({required: true})
    set dataModel(dataModel: DataModel) {
        this._dataModel = dataModel;
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

    @ViewChild(Table)
    pTable!: Table;

    protected nextPageNo: number = 0;
    private sortBy: any[] = [];
    protected idField: string = "";

    protected pagesLoaded = new Set();
    protected pagesInProgress = new Set();


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
        if (typeof this.multi === 'string') {
            this.multi = Util.parseBoolean(this.multi);
        }
        this.idField = this.dataModel.getKeyField();

    }

    dataPushEventHandler(event: DataPushEvent) {
        switch (event.operation) {
            case DataPushEvents.UPDATED_DATA:
                if (event.srcOptions.append === true) {
                    this.appendData(event.data!, event.pageNo!);
                }
                if (event.srcOptions.append === false) {
                    this.setData(event.data!);
                }
                break;
            case DataPushEvents.START_FETCH:
                this.loading = true;
                break;
            default:
                this.loading = false;
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
        if (this.dataModel.hasPage(this.nextPageNo) && !this.pagesLoaded.has(this.nextPageNo)) {
            this.dataModel.pageNo(this.nextPageNo)
            this.dataModel.orderBy(this.sortBy);
            if (options.filters && options.filters.length > 0) {
                this.dataModel.filter(options.filters)
            }
            await this.dataModel.apply(options);
            this.pagesInProgress.add(this.nextPageNo);
        }

    }

    lazyLoad(event: TableLazyLoadEvent) {
        console.log("lazy", event);
        this.requestForData({append: true})
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
