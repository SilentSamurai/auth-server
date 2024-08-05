import {DataModel, DataPushEvent, DataPushEvents, Query} from "./DataModel";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {lastValueFrom} from "rxjs";
import {EventEmitter} from "@angular/core";
import {Filter} from "./Filters";


export class RestApiModel implements DataModel {

    query: Query = new Query();
    totalCount: number | null = null;

    _dataPusher = new EventEmitter<DataPushEvent>();

    constructor(private http: HttpClient,
                private path: string,
                private keyField: string,
                private data: any[]) {


    }


    dataPusher(): EventEmitter<DataPushEvent> {
        return this._dataPusher;
    }

    hasNextPage(pageNo: number): boolean {
        return this.hasPage(pageNo + 1);
    }

    hasPage(pageNo: number): boolean {
        if (pageNo == 0) {
            return true;
        }
        if (this.totalCount == null || isNaN(this.totalCount)) {
            return true;
        }
        const pageCount = this.totalCount / this.query.pageSize;
        return pageNo < pageCount;
    }

    getData(): any[] {
        return this.data;
    }

    async apply(srcOptions: any): Promise<boolean> {
        this._dataPusher.emit({
            srcOptions: srcOptions,
            operation: DataPushEvents.START_FETCH,
            data: null,
            pageNo: null
        })

        const options = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            })
        }
        const body = {
            "pageNo": this.query.pageNo,
            "pageSize": this.query.pageSize,
            "filters": this.query.filters,
            "orderBy": this.query.orderBy,
            "expand": this.query.expand
        }
        let objectObservable = this.http.post(this.path, body, options);
        let response = await lastValueFrom(objectObservable) as any;
        this.data = response.data;
        this.totalCount = response.totalCount;

        this._dataPusher.emit({
            srcOptions: srcOptions,
            operation: DataPushEvents.UPDATED_DATA,
            data: this.data,
            pageNo: this.query.pageNo
        })

        this._dataPusher.emit({
            srcOptions: srcOptions,
            operation: DataPushEvents.END_FETCH,
            data: null,
            pageNo: null
        })
        return true;
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


}

