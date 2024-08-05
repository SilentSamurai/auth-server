import {DataPushEvents} from "./DataModel";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {lastValueFrom} from "rxjs";
import {BaseDataModel} from "./BaseDataModel";


export class RestApiModel extends BaseDataModel {

    totalCount: number | null = null;

    constructor(private http: HttpClient,
                private path: string,
                keyField: string,
                private data: any[]) {
        super(keyField);

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

    totalRowCount(): number {
        if (this.totalCount == null || isNaN(this.totalCount)) {
            return 0;
        }
        return this.totalCount;
    }


}

