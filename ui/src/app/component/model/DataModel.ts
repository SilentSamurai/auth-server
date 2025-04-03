import {EventEmitter} from "@angular/core";
import {Filter} from "./Filters";


export class Query {
    private _pageNo: number = 0;
    private _pageSize: number = 50;
    private _filters: Filter[] = [];
    private _orderBy: any[] = [];
    private _expand: string[] = [];

    get pageNo(): number {
        return this._pageNo;
    }

    set pageNo(value: number) {
        this._pageNo = value;
    }

    get pageSize(): number {
        return this._pageSize;
    }

    set pageSize(value: number) {
        if (value < 0) {
            console.warn("Negative number not allowed in page size");
            return;
        }
        this._pageSize = value;
    }

    get filters(): Filter[] {
        return this._filters;
    }

    set filters(value: Filter[]) {
        this._filters = value.filter(item => item.value != null && item.value.length > 0);
    }

    get orderBy(): any[] {
        return this._orderBy;
    }

    set orderBy(value: any[]) {
        this._orderBy = value;
    }

    get expand(): string[] {
        return this._expand;
    }

    set expand(value: string[]) {
        this._expand = value;
    }
}


export enum DataPushEventStatus {
    UPDATED_DATA,
    START_FETCH,
    END_FETCH
}

export class DataPushEvent {
    srcOptions: any;
    operation: DataPushEventStatus = DataPushEventStatus.UPDATED_DATA;
    data: any[] | null = [];
    pageNo: number | null = null;
}

export interface DataModel {

    dataPusher(): EventEmitter<DataPushEvent>;

    getKeyFields(): string[];

    filter(filters: Filter[]): void;

    getFilters(): Filter[];

    orderBy(sortBy: any[]): void;

    getOrderBy(): any[];

    getPageSize(): number;

    pageSize(pageSize: number): void;

    pageNo(pageNo: number): void;

    getPageNo(): number;

    apply(srcOptions: any): Promise<boolean>;

    getData(): any[];

    hasNextPage(pageNo: number): boolean;

    hasPage(pageNo: number): boolean;

    totalRowCount(): number;

    getPageNoFromRow(first: number): number;
}


