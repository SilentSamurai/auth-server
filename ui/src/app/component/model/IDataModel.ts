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
    constructor(config: IQueryConfig) {
        this.update(config);
    }

    private _pageNo: number = 0;

    get pageNo(): number {
        return this._pageNo;
    }

    set pageNo(value: number) {
        this._pageNo = value;
    }

    private _pageSize: number = 50;

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

    private _filters: Filter[] = [];

    get filters(): Filter[] {
        return this._filters;
    }

    set filters(value: Filter[]) {
        this._filters = value.filter(
            (item) => item.value != null && item.value.length > 0,
        );
    }

    private _orderBy: SortConfig[] = [];

    get orderBy(): SortConfig[] {
        return this._orderBy;
    }

    set orderBy(value: SortConfig[]) {
        this._orderBy = value;
    }

    private _expand: string[] = [];

    get expand(): string[] {
        return this._expand;
    }

    set expand(value: string[]) {
        this._expand = value;
    }

    public update(config: IQueryConfig) {
        if (config.pageNo !== undefined) this.pageNo = config.pageNo;
        if (config.pageSize !== undefined) this.pageSize = config.pageSize;
        if (config.filters) this.filters = config.filters;
        if (config.orderBy) this.orderBy = config.orderBy;
        if (config.expand) this.expand = config.expand;
        return this;
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
