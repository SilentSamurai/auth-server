import {DataPushEventStatus} from "./DataModel";
import {HttpClient, HttpHeaders, HttpErrorResponse} from "@angular/common/http";
import {lastValueFrom} from "rxjs";
import {BaseDataModel} from "./BaseDataModel";
import {Filter} from "./Filters";

export interface ApiResponse<T> {
    data: T[];
    count?: number;
    totalCount?: number;
}

export interface ApiRequest {
    pageNo: number;
    pageSize: number;
    where: any[];
    orderBy: any[];
    expand: string[];
}

export interface RestApiConfig {
    pageSize?: number;
}

export class RestApiModel<T> extends BaseDataModel<T> {
    protected override data: T[] = [];
    private totalCount: number | null = null;
    private readonly defaultHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
    });
    private config: Required<RestApiConfig>;

    constructor(
        private http: HttpClient,
        private path: string,
        keyFields: string[],
        initialData: T[] = [],
        config: RestApiConfig = {}
    ) {
        super(keyFields);
        this.config = {
            pageSize: config.pageSize ?? 50
        };
        this.data = initialData;
        this.query.pageSize = this.config.pageSize;
    }

    override hasPage(pageNo: number): boolean {
        if (pageNo === 0) {
            return true;
        }
        if (this.totalCount == null || isNaN(this.totalCount)) {
            return true;
        }
        const pageCount = Math.ceil(this.totalCount / this.getPageSize());
        return pageNo < pageCount;
    }

    override getData(): T[] {
        return this.data;
    }

    override filter(filters: Filter[]) {
        super.filter(filters);
        this.totalCount = null;
    }

    override async apply(srcOptions: any): Promise<boolean> {
        try {
            this.emitDataEvent({
                operation: DataPushEventStatus.START_FETCH
            });

            const filters = this.query.filters.map(f => f.toJSON());

            // Get total count if needed
            if (this.totalCount == null || isNaN(this.totalCount)) {
                await this.getTotalCount(filters);
            }

            const response = await this.fetchData(filters);
            this.emitResponse(response, srcOptions);
            return true;
        } catch (error) {
            this.emitError(error, srcOptions);
            return false;
        } finally {
            this.emitDataEvent({
                operation: DataPushEventStatus.END_FETCH
            });
        }
    }

    private async fetchData(filters: any[]): Promise<ApiResponse<T>> {
        const body: ApiRequest = {
            pageNo: this.query.pageNo,
            pageSize: this.getPageSize(),
            where: filters,
            orderBy: this.query.orderBy,
            expand: this.query.expand
        };

        return await lastValueFrom(
            this.http.post<ApiResponse<T>>(this.path, body, {
                headers: this.defaultHeaders
            })
        );
    }

    private async getTotalCount(filters: any[]): Promise<void> {
        const body = {
            where: filters,
            select: "count"
        };

        const response = await lastValueFrom(
            this.http.post<{count: number}>(this.path, body, {
                headers: this.defaultHeaders
            })
        );

        this.totalCount = response.count;
    }

    private emitResponse(response: ApiResponse<T>, srcOptions: any): void {
        this.data = response.data;
        if (response.totalCount !== undefined) {
            this.totalCount = response.totalCount;
        }

        this.emitDataEvent({
            operation: DataPushEventStatus.UPDATED_DATA,
            data: this.data,
            pageNo: this.query.pageNo,
            srcOptions
        });
    }

    private emitError(error: unknown, srcOptions: any): void {
        const httpError = error instanceof HttpErrorResponse ? error :
            new Error(error instanceof Error ? error.message : String(error));

        this.emitDataEvent({
            operation: DataPushEventStatus.UPDATED_DATA,
            data: null,
            pageNo: this.query.pageNo,
            error: httpError,
            srcOptions
        });
    }

    override totalRowCount(): number {
        return this.totalCount ?? 0;
    }
}

