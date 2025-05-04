import {
    booleanAttribute,
    Component,
    ContentChild,
    ContentChildren,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
} from '@angular/core';
import {TableColumnComponent} from './app-table-column.component';
import {AppTableButtonComponent} from './app-table-button.component';
import {DataSource, IDataModel, Query} from '../model/DataModels';
import {Filter} from '../model/Filters';
import {BehaviorSubject, Subscription} from 'rxjs';
import {DataModel} from "../model/DataModel";

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
                <div class="d-flex gap-2">
                    <ng-container *ngFor="let btnTmpl of buttons">
                        <ng-container
                            [ngTemplateOutlet]="btnTmpl.template"
                        ></ng-container>
                    </ng-container>
                    <button
                        type="button"
                        class="btn btn-sm"
                        (click)="refresh()"
                        pRipple
                    >
                        <i class="pi pi-refresh"></i>
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm"
                        (click)="exportToCSV()"
                        pRipple
                    >
                        <i class="pi pi-download"></i>
                    </button>
                </div>
            </div>
        </div>
        <div
            class="table-responsive"
            [style.max-height]="scrollHeight"
            (scroll)="lazyLoad($event)"
        >
            <table class="table a-table table-striped table-hover table-sm">
                <thead class="sticky-top top-0">
                <tr style="min-height:35px">
                    <th style="width:40px">
                        <input *ngIf="multi"
                               class="form-check-input"
                               type="checkbox"
                               value=""
                               [checked]="isAllSelected$ | async"
                               (click)="onSelectAll()"/>
                    </th>
                    <ng-container
                        *ngFor="let col of columns; let i = index"
                    >
                        <ng-container
                            *ngIf="col.isTemplateProvided"
                            [ngTemplateOutlet]="col.templateRef"
                        ></ng-container>
                        <ng-container *ngIf="!col.isTemplateProvided">
                            <th
                                scope="col"
                                [class.sortable]="col.sortable"
                                (click)="col.sortable && sort(col.name)"
                                [style.min-width.px]="col.width || 150"
                            >
                                <div class="d-flex align-items-center">
                                    {{ col.label }}
                                    <i
                                        *ngIf="col.sortable"
                                        [class]="getSortIcon(col.name)"
                                        class="ms-1"
                                    ></i>
                                </div>
                            </th>
                        </ng-container>
                    </ng-container>
                </tr>
                </thead>
                <tbody>
                <ng-container *ngFor="let row of actualRows">
                    <tr class="a-table-row" style="height:35px" (click)="onRowSelect(row)">
                        <td style="width:40px">
                            <input *ngIf="multi"
                                   class="form-check-input"
                                   type="checkbox" value="" readonly
                                   [checked]="isSelected(row)"/>

                            <input *ngIf="!multi"
                                   class="form-check-input"
                                   name="table-selection"
                                   type="radio" value="" readonly
                                   [checked]="isSelected(row)"/>
                        </td>
                        <ng-container *ngIf="body">
                            <ng-container
                                *ngTemplateOutlet="
                                        body;
                                        context: {$implicit: row}
                                    "
                            ></ng-container>
                        </ng-container>
                        <ng-container *ngIf="!body"> No data</ng-container>
                    </tr>
                </ng-container>
                <tr style="height:40px" *ngIf="loading">
                    <td>
                        <div class="loading-text"></div>
                        <p-skeleton
                            [ngStyle]="{width: '100%'}"
                        ></p-skeleton>
                    </td>
                    <td *ngFor="let col of columns">
                        <div class="loading-text"></div>
                        <p-skeleton
                            [ngStyle]="{width: '100%'}"
                        ></p-skeleton>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    `,
    styles: [
        `
            .a-table-caption {
                background-color: var(--bs-card-bg);
                color: var(--bs-body-color);
                /*border-color: var(--bs-border-color);*/
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
                background-color: var(
                    --bs-table-hover-bg,
                    rgba(var(--bs-primary-rgb, 13, 110, 253), 0.05)
                );
            }

            .a-table-row.selected {
                background-color: var(
                    --bs-table-active-bg,
                    rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1)
                );
            }

            .btn-sm {
                color: var(--bs-body-color);
            }

            .sortable {
                cursor: pointer;
                user-select: none;
            }

            .sortable:hover {
                background-color: var(
                    --bs-table-hover-bg,
                    rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1)
                );
            }

            .resize-handle {
                position: absolute;
                right: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                cursor: col-resize;
                background: transparent;
            }

            .resize-handle:hover {
                background: var(--bs-primary);
            }

            /* Dark mode specific styles */
            [data-bs-theme='dark'] {
                .a-table-caption {
                    background-color: var(--bs-dark);
                    color: var(--bs-light);
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
                    background-color: var(
                        --bs-table-hover-bg,
                        rgba(255, 255, 255, 0.075)
                    );
                }

                .a-table-row.selected {
                    background-color: var(
                        --bs-table-active-bg,
                        rgba(255, 255, 255, 0.1)
                    );
                }

                .btn-sm {
                    color: var(--bs-light);
                }
            }
        `,
    ],
})
// Table for reuse
export class AppTableComponent implements OnInit, OnDestroy {
    loading: boolean = false;
    @Input() title: string = '';
    @Input() scrollHeight: string = '65vh';
    @Input({transform: booleanAttribute}) multi: boolean = true;

    @Input() selection: any[] = [];
    @Output() selectionChange: EventEmitter<any[]> = new EventEmitter();

    @ContentChild('table_body')
    body: TemplateRef<any> | null = null;
    actualRows: any[] = [];

    @ContentChildren(TableColumnComponent)
    columns!: QueryList<TableColumnComponent>;

    @ContentChildren(AppTableButtonComponent)
    buttons!: QueryList<AppTableButtonComponent>;

    isAllSelected$ = new BehaviorSubject<true | null>(null);
    idFields: string[] = [];
    protected pagesInProgress = new Set();
    protected selectedKeys: Set<string> = new Set();
    private query: Query = new Query({});
    private sortDirection: { [key: string]: 'asc' | 'desc' } = {};
    private currentSortColumn: string | null = null;
    private _subscriptions = new Subscription();

    constructor() {
    }

    _dataModel!: IDataModel<any>;

    get dataModel(): IDataModel<any> {
        return this._dataModel;
    }

    @Input({required: true})
    set dataSource(dataSource: DataSource<any>) {
        this._dataModel = new DataModel(dataSource);
        this.idFields = dataSource.keyFields();
    }

    async ngOnInit(): Promise<void> {
        this._subscriptions.add(
            this._dataModel.dataSourceEvents().subscribe((x) => {
                if (x.type == 'data-updated') {
                    this.refresh();
                }
            }),
        );

        this.selection.forEach(item => this.selectRow(item));

        this.refresh();
    }

    ngOnDestroy(): void {
        this._subscriptions.unsubscribe();
    }

    getKeyValue(row: any) {
        return this.idFields
            .map((kf) => row[kf]?.toString() ?? 'null')
            .join('|');
    }

    async requestForData(query: Query, append: boolean) {
        if (
            !this.pagesInProgress.has(query.pageNo) &&
            this.dataModel.hasPage(query.pageNo, query.pageSize)
        ) {
            if (!append) {
                this.pagesInProgress.clear();
                query.pageNo = 0;
            } else {
                query.pageNo += 1;
            }
            this.pagesInProgress.add(query.pageNo);
            try {
                this.loading = true;
                const response = await this.dataModel.execute(query);
                if (append) {
                    this.appendData(response.data);
                } else {
                    this.setData(response.data);
                }
            } finally {
                this.loading = false;
                this.pagesInProgress.delete(query.pageNo);
            }
        }
    }

    lazyLoad(event: any) {
        // console.log("lazy", event);
        const reachedEnd =
            event.target.offsetHeight + event.target.scrollTop >=
            event.target.scrollHeight - 1;
        // console.log(reachedEnd, event.target.offsetHeight + event.target.scrollTop, event.target.scrollHeight);
        if (reachedEnd && this.pagesInProgress.size < 1) {
            console.log('lazy', event);
            this.requestForData(this.query, true).catch((err) =>
                console.error(err),
            );
        }
    }

    filter(filters: Filter[]) {
        this.requestForData(
            this.query.update({filters, pageNo: 0}),
            false,
        ).catch((err) => console.error(err));
    }

    refresh() {
        this.requestForData(this.query.update({pageNo: 0}), false).catch(
            (err) => console.error(err),
        );
    }

    sort(column: string) {
        if (this.currentSortColumn !== column) {
            // New column being sorted
            this.currentSortColumn = column;
            this.sortDirection[column] = 'asc';
        } else {
            // Same column, toggle direction
            this.sortDirection[column] =
                this.sortDirection[column] === 'asc' ? 'desc' : 'asc';
        }

        const orderBy = [
            {
                field: column,
                order: this.sortDirection[column],
            },
        ];

        this.requestForData(
            this.query.update({orderBy, pageNo: 0}),
            false,
        ).catch((err) => console.error(err));
    }

    getSortIcon(column: string): string {
        if (this.currentSortColumn != column) return 'fa fa-sort';
        return this.sortDirection[column] === 'asc'
            ? 'fa fa-sort-asc'
            : 'fa fa-sort-desc';
    }

    exportToCSV() {
        const headers = this.columns.map((col) => col.label);
        const rows = this.actualRows.map((row) =>
            this.columns
                .map(
                    (col) =>
                        `"${(row[col.name] ?? '').toString().replace(/"/g, '""')}"`,
                )
                .join(','),
        );
        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${this.title || 'table'}_export.csv`;
        link.click();
    }

    selectRow(row: any) {
        if (!this.multi) {
            this.selectedKeys.clear();
        }
        const key = this.getKeyValue(row);
        if (this.selectedKeys.has(key)) {
            this.selectedKeys.delete(key);
        } else {
            this.selectedKeys.add(key);
        }

        if (this.multi) {
            const isAllSelected = this.actualRows.length > 0 &&
                this.actualRows.every(item => this.selectedKeys.has(this.getKeyValue(item)));

            this.isAllSelected$.next(isAllSelected ? true : null);
        }
    }

    onRowSelect(row: any) {
        this.selectRow(row);

        this.selection = this.actualRows.filter(
            (row) => this.isSelected(row),
        );
        this.selectionChange.next(this.selection);
    }

    isSelected(row: any) {
        return this.selectedKeys.has(this.getKeyValue(row)) ? true : null;
    }

    onSelectAll() {
        if (!this.isAllSelected$.getValue()) {
            this.selectedKeys = new Set(this.actualRows.map(row => this.getKeyValue(row)));
            this.isAllSelected$.next(true);
        } else {
            this.selectedKeys.clear();
            this.isAllSelected$.next(null);
        }
    }


    protected setData(data: any[]) {
        this.actualRows = data;
    }

    protected appendData(data: any[]) {
        if (data.length > 0) {
            // this.actualRows.push(...data);
            this.actualRows = [...this.actualRows, ...data];
        }
        // this.isLastPageReached = !i3*sNextPageAvailable;
    }


}
