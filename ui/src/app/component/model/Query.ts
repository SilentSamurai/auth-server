import {Filter} from "./Filters";

export interface IQueryConfig {
    pageNo?: number;
    pageSize?: number;
    filters?: Filter[];
    orderBy?: SortConfig[];
    expand?: string[];
}

export interface SortConfig {
    field: string;
    order: 'asc' | 'desc';
}


export class Query {
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

    public append(config: IQueryConfig) {
        if (config.pageNo !== undefined) this.pageNo = config.pageNo;
        if (config.pageSize !== undefined) this.pageSize = config.pageSize;
        if (config.filters) this.filters.push(...config.filters);
        if (config.orderBy) this.orderBy.push(...config.orderBy);
        if (config.expand) this.expand.push(...config.expand);
        return this;
    }
}

export function query(config: IQueryConfig) {
    return new Query(config);
}
