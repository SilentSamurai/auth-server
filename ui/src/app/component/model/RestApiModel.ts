import {HttpClient, HttpHeaders} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';
import {BaseDataSource, ReturnedData} from "./DataSource";
import {Query} from "./Query";

export interface ApiRequest {
    pageNo: number;
    pageSize: number;
    where: any[];
    orderBy: any[];
    expand: string[];
}

export class RestApiModel<T> extends BaseDataSource<T> {
    private readonly defaultHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
    });

    constructor(
        private http: HttpClient,
        private path: string,
        keyFields: string[],
        query: Query = new Query({}),
    ) {
        super(keyFields, query);
    }

    async queryData(query: Query): Promise<ReturnedData<T>> {
        const body: ApiRequest = {
            pageNo: query.pageNo,
            pageSize: query.pageSize,
            where: query.filters,
            orderBy: query.orderBy,
            expand: query.expand,
        };

        return await lastValueFrom(
            this.http.post<ReturnedData<T>>(this.path, body, {
                headers: this.defaultHeaders,
            }),
        );
    }

    public async queryCount(query: Query): Promise<number> {
        const body = {
            where: query.filters,
            select: 'count',
        };

        const response = await lastValueFrom(
            this.http.post<{ count: number }>(this.path, body, {
                headers: this.defaultHeaders,
            }),
        );

        return response.count ? response.count : 0;
    }
}
