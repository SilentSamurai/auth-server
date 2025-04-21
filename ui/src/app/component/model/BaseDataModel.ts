import {EventEmitter} from "@angular/core";
import {Filter} from "./Filters";
import {DataModel, DataPushEvent, Query, DataPushEventStatus, SortConfig} from "./DataModel";


export abstract class BaseDataModel<T> implements DataModel {
    protected query: Query;
    protected _dataPusher = new EventEmitter<DataPushEvent>();
    protected loading = false;
    protected error: Error | null = null;
    protected retryCount = 0;
    protected data: T[] = [];

    protected constructor(
        protected keyFields: string[]
    ) {
        this.query = new Query();
    }

    protected emitDataEvent(
        params: {
            operation: DataPushEventStatus;
            data?: T[] | null;
            pageNo?: number | null;
            error?: Error;
            srcOptions?: any;
        }
    ): void {
        this._dataPusher.emit({
            operation: params.operation,
            data: params.data ?? null,
            pageNo: params.pageNo ?? null,
            error: params.error,
            srcOptions: params.srcOptions ?? {}
        });
    }

    dataPusher(): EventEmitter<DataPushEvent> {
        return this._dataPusher;
    }

    hasNextPage(pageNo: number): boolean {
        return this.hasPage(pageNo + 1);
    }

    filter(filters: Filter[]): void {
        this.query.filters = filters;
    }

    getPageSize(): number {
        return this.query.pageSize;
    }

    orderBy(orderBy: SortConfig[]): void {
        this.query.orderBy = orderBy;
    }

    pageNo(pageNo: number): void {
        this.query.pageNo = pageNo;
    }

    pageSize(pageSize: number): void {
        this.query.pageSize = pageSize;
    }

    expands(options: string[]): void {
        this.query.expand = options;
    }

    getExpand(): string[] {
        return this.query.expand;
    }

    getKeyFields(): string[] {
        return this.keyFields;
    }

    getFilters(): Filter[] {
        return this.query.filters;
    }

    getOrderBy(): SortConfig[] {
        return this.query.orderBy;
    }

    getPageNo(): number {
        return this.query.pageNo;
    }

    getPageNoFromRow(rowNo: number): number {
        return Math.floor(rowNo / this.getPageSize());
    }

    isLoading(): boolean {
        return this.loading;
    }

    getError(): Error | null {
        return this.error;
    }

    abstract apply(srcOptions: any): Promise<boolean>;

    abstract getData(): T[];

    abstract hasPage(pageNo: number): boolean;

    abstract totalRowCount(): number;
}
