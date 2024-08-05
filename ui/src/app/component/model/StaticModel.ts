import {DataModel, DataPushEvent, DataPushEvents, Query} from "./DataModel";

import {EventEmitter} from "@angular/core";
import {Filter} from "./Filters";


export class StaticModel implements DataModel {

    data: any[] = []
    query: Query = new Query();
    _dataPusher = new EventEmitter<DataPushEvent>();

    constructor(private keyField: string) {
    }

    dataPusher(): EventEmitter<DataPushEvent> {
        return this._dataPusher;
    }

    hasNextPage(pageNo: number): boolean {
        return this.hasPage(pageNo + 1);
    }

    hasPage(pageNo: number): boolean {
        return pageNo == 0;
    }

    async apply(srcOptions: any): Promise<boolean> {
        const event: DataPushEvent = {
            srcOptions: srcOptions,
            operation: DataPushEvents.UPDATED_DATA,
            data: this.data,
            pageNo: this.query.pageNo
        };
        this._dataPusher.emit(event)
        return true;
        // this.query = query;
    }

    filter(filters: Filter[]): void {
        this.query.filters = filters;
    }

    getData(): any[] {
        return this.data;
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

    getKeyField(): string {
        return this.keyField;
    }

    appendData(data: any[]): void {
        this.data.push(...data);
        this.apply({append: true});
    }

    setData(data: any[]): void {
        this.data = [...data];
        this.apply({append: false})
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

