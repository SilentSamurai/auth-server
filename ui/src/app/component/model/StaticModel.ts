import {DataModel, DataPushEvent, DataPushEvents, Query} from "./DataModel";
import {Filter} from "../filter-bar/filter-bar.component";
import {EventEmitter} from "@angular/core";
import {query} from "@angular/animations";


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
        this._dataPusher.emit({
            srcOptions: srcOptions,
            operation: DataPushEvents.UPDATED_DATA,
            data: this.data,
            pageNo: this.query.pageNo
        })
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
        return 0;
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
        this.data.push(data);
        this.apply({append: true})
    }

    setData(data: any[]): void {
        this.data = data;
        this.apply({append: false})
    }


}

