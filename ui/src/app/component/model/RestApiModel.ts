import {DataPushEventStatus} from "./DataModel";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {lastValueFrom} from "rxjs";
import {BaseDataModel} from "./BaseDataModel";
import {Filter} from "./Filters";


export class RestApiModel extends BaseDataModel {

    totalCount: number | null = null;

    constructor(private http: HttpClient,
                private path: string,
                keyFields: string[],
                private data: any[]) {
        super(keyFields);
        // this.getTotalCount([]);
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

    override filter(filters: Filter[]) {
        super.filter(filters);
        this.totalCount = null;
    }

    async apply(srcOptions: any): Promise<boolean> {
        this._dataPusher.emit({
            srcOptions: srcOptions,
            operation: DataPushEventStatus.START_FETCH,
            data: null,
            pageNo: null
        })

        const options = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            })
        }
        const filters = this.query.filters.map(f => {
            return {
                label: f.label,
                value: f.value,
                name: f.name,
                operator: f.operator.label,
            }
        });

        if (this.totalCount == null || isNaN(this.totalCount)) {
            await this.getTotalCount(filters);
        }

        const body = {
            "pageNo": this.query.pageNo,
            "pageSize": this.query.pageSize,
            "where": filters,
            "orderBy": this.query.orderBy,
            "expand": this.query.expand
        }
        let objectObservable = this.http.post(this.path, body, options);
        let response = await lastValueFrom(objectObservable) as any;
        this.data = response.data;
        // this.totalCount = response.totalCount;


        this._dataPusher.emit({
            srcOptions: srcOptions,
            operation: DataPushEventStatus.UPDATED_DATA,
            data: this.data,
            pageNo: this.query.pageNo
        })

        this._dataPusher.emit({
            srcOptions: srcOptions,
            operation: DataPushEventStatus.END_FETCH,
            data: null,
            pageNo: null
        })
        return true;
    }

    async getTotalCount(filters: any[]) {
        const options = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            })
        }
        const body = {
            where: filters,
            select: "count"
        }
        let objectObservable = this.http.post(this.path, body, options);
        let response = await lastValueFrom(objectObservable) as any;
        this.totalCount = response.count;
    }

    totalRowCount(): number {
        if (this.totalCount == null || isNaN(this.totalCount)) {
            return 0;
        }
        return this.totalCount;
    }


}

