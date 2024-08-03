import {Filter} from "../filter-bar/filter-bar.component";
import {EventEmitter} from "@angular/core";


export class Query {
    pageNo: number = 0;
    pageSize: number = 30;
    filters: Filter[] = [];
    orderBy: any[] = [];
    expand: string[] = [];
}

export enum DataPushEvents {
    UPDATED_DATA,
    START_FETCH,
    END_FETCH
}

export class DataPushEvent {
    srcOptions: any;
    operation: DataPushEvents = DataPushEvents.UPDATED_DATA;
    data: any[] | null = [];
    pageNo: number | null = null;
}

export interface DataModel {

    dataPusher(): EventEmitter<DataPushEvent>;

    getKeyField(): string;

    filter(filters: Filter[]): void;

    orderBy(sortBy: any[]): void;

    getPageSize(): number;

    pageSize(pageSize: number): void;

    pageNo(pageNo: number): void;

    apply(srcOptions: any): Promise<boolean>;

    getData(): any[];

    hasNextPage(pageNo: number): boolean;

    hasPage(pageNo: number): boolean;



}
