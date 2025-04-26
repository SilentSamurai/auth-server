import { DataSource, DataSourceEvents, Query, ReturnedData } from './IDataModel';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom, Observable, Subject } from 'rxjs';

export interface ApiRequest {
    pageNo: number;
    pageSize: number;
    where: any[];
    orderBy: any[];
    expand: string[];
}

export class RestApiModel<T> implements DataSource<T> {
    private eventSubject = new Subject<DataSourceEvents>();
    private readonly defaultHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
    });

    constructor(
        private http: HttpClient,
        private path: string,
        protected _keyFields: string[],
        private expands: string[] = [],
    ) {}

    keyFields(): string[] {
        return this._keyFields;
    }

    updates(): Observable<DataSourceEvents> {
        return this.eventSubject;
    }

    async fetchData(query: Query): Promise<ReturnedData<T>> {
        const body: ApiRequest = {
            pageNo: query.pageNo,
            pageSize: query.pageSize,
            where: query.filters,
            orderBy: query.orderBy,
            expand: query.expand || this.expands,
        };

        return await lastValueFrom(
            this.http.post<ReturnedData<T>>(this.path, body, {
                headers: this.defaultHeaders,
            }),
        );
    }

    public async totalCount(query: Query): Promise<number> {
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
