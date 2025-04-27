import {Filter} from './Filters';
import {Observable} from 'rxjs';

export interface SortConfig {
    field: string;
    order: 'asc' | 'desc';
}

export interface ReturnedData<T> {
    data: T[];
    count?: number;
    isLastPage: boolean;
}

export interface DataSource<T> {
    fetchData(query: IQueryConfig): Promise<ReturnedData<T>>;

    totalCount(query: IQueryConfig): Promise<number>;

    keyFields(): string[];

    updates(): Observable<DataSourceEvents>;
}

export interface DataModelStatus {
    loading: boolean;
    error?: string;
    isLastPageReached: boolean;
}

export interface DataSourceEvents {
    type: 'data-updated' | 'unknown';
    source: string;
    data?: any;
}

export interface IQueryConfig {
    pageNo?: number;
    pageSize?: number;
    filters?: Filter[];
    orderBy?: SortConfig[];
    expand?: string[];
}

export class Query implements IQueryConfig {
    private _pageNo: number = 0;
    private _pageSize: number = 50;
    private _filters: Filter[] = [];
    private _orderBy: SortConfig[] = [];
    private _expand: string[] = [];

    constructor(config: IQueryConfig) {
        this.update(config);
    }

    public update(config: IQueryConfig) {
        if (config.pageNo !== undefined) this.pageNo = config.pageNo;
        if (config.pageSize !== undefined) this.pageSize = config.pageSize;
        if (config.filters) this.filters = config.filters;
        if (config.orderBy) this.orderBy = config.orderBy;
        if (config.expand) this.expand = config.expand;
        return this;
    }

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
            console.warn('Negative number not allowed in page size');
            return;
        }
        this._pageSize = value;
    }

    get filters(): Filter[] {
        return this._filters;
    }

    set filters(value: Filter[]) {
        this._filters = value.filter(
            (item) => item.value != null && item.value.length > 0,
        );
    }

    get orderBy(): SortConfig[] {
        return this._orderBy;
    }

    set orderBy(value: SortConfig[]) {
        this._orderBy = value;
    }

    get expand(): string[] {
        return this._expand;
    }

    set expand(value: string[]) {
        this._expand = value;
    }
}

export interface IDataModel<T> {
    execute(query: Query): Promise<ReturnedData<T>>;

    hasPage(pageNo: number, pageSize: number): boolean;

    getStatus(): DataModelStatus;

    totalRowCount(): number;

    reset(): void;

    dataSource(): DataSource<T>;

    dataSourceEvents(): Observable<DataSourceEvents>;
}
