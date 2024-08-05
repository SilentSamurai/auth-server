import {EventEmitter} from "@angular/core";
import {Filter} from "./Filters";
import {DataModel, DataPushEvent, Query} from "./DataModel";

export abstract class BaseDataModel implements DataModel {

    query: Query = new Query();
    _dataPusher = new EventEmitter<DataPushEvent>();

    protected constructor(private keyField: string) {
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

    orderBy(orderBy: any[]): void {
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

    getKeyField(): string {
        return this.keyField;
    }

    getFilters(): Filter[] {
        return this.query.filters;
    }

    getOrderBy(): any[] {
        return this.query.orderBy;
    }

    getPageNo(): number {
        return this.query.pageNo;
    }

    getPageNoFromRow(rowNo: number): number {
        return Math.round(rowNo / this.getPageSize());
    }

    abstract apply(srcOptions: any): Promise<boolean>;

    abstract getData(): any[];

    abstract hasPage(pageNo: number): boolean;

    abstract totalRowCount(): number;
}
