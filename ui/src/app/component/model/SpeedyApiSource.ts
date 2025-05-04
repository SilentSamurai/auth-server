import {lastValueFrom} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Filter} from './Filters';
import {Operators} from './Operator';
import {BaseDataSource, ReturnedData} from "./DataSource";
import {Query} from "./Query";

export class SpeedyApiSource<T> extends BaseDataSource<T> {
    constructor(
        private http: HttpClient,
        private path: string,
        keyFields: string[],
        baseQuery: Query = new Query({}),
    ) {
        super(keyFields, baseQuery);
    }

    async queryData(query: Query): Promise<ReturnedData<T>> {
        const options = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
        };
        const filters = this.filterToWhere(query.filters);

        const body = {
            $page: {
                $index: query.pageNo,
                $size: query.pageSize,
            },
            $where: filters,
            $orderBy: query.orderBy,
            $expand: query.expand,
        };
        let objectObservable = this.http.post(this.path, body, options);
        let response = (await lastValueFrom(
            objectObservable,
        )) as PaginatedResponse<T>;

        return {data: response.payload, count: response.pageCount};
    }

    async queryCount(query: Query): Promise<number> {
        const options = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
        };
        const filters = this.filterToWhere(query.filters);

        const body = {
            $where: filters,
            $select: ['count'],
        };
        let objectObservable = this.http.post(this.path, body, options);
        let response = (await lastValueFrom(objectObservable)) as any;
        return response.count;
    }

    filterToWhere(filters: Filter[]) {
        let where: any = {};
        for (const filter of filters) {
            if (filter.operator === Operators.EQ) {
                where[filter.field] = {$eq: filter.value};
            }
            if (filter.operator === Operators.OR) {
                where['$or'] = [];
                for (const innerFilter of filter.value as Filter[]) {
                    where['$or'].push(this.filterToWhere([innerFilter]));
                }
            }
            if (filter.operator === Operators.AND) {
                where['$and'] = [];
                for (const innerFilter of filter.value as Filter[]) {
                    where['$and'].push(this.filterToWhere([innerFilter]));
                }
            }
            if (filter.operator === Operators.MATCHES) {
                where[filter.field] = {$matches: filter.value};
            }
        }
        return where;
    }
}

export class PaginatedResponse<T> {
    payload: T[];
    pageCount: number;
    pageIndex: number;

    /**
     * Constructs a PaginatedResponse object using data from the backend
     * and a type constructor for mapping each payload item.
     * @param data - Incoming data including payload, pageCount, and pageIndex.
     * @param type - Constructor that maps each item in the payload to a typed object.
     */
    constructor(data: any) {
        // Map raw payload items to properly typed objects.
        this.payload = data.payload || [];
        this.pageCount = data.pageCount || 0;
        this.pageIndex = data.pageIndex || 0;
    }

    /**
     * Creates a new PaginatedResponse from the given raw data and a constructor type.
     * @param resp - Raw data object typically returned by the backend.
     * @param type - Class constructor to transform each payload item.
     * @returns A newly created PaginatedResponse of type T.
     */
    static from<T>(resp: any): PaginatedResponse<T> {
        return new PaginatedResponse<T>(resp);
    }
}
