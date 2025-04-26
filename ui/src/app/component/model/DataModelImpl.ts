import {DataModel, DataModelStatus, DataSource, DataSourceEvents, IQuery, ReturnedData} from "./DataModel";
import {Observable, Subscription} from "rxjs";

// Helper function to create a stable string representation of the query for caching
function getQueryCacheKey(query: IQuery): string {
    // Ensure consistent property order for reliable caching
    const keyObject = {
        pageNo: query.pageNo ?? 0,
        pageSize: query.pageSize ?? 10, // Use default or actual
        filters: query.filters ? [...query.filters].sort((a, b) => a.name.localeCompare(b.name)) : [],
        orderBy: query.orderBy ? [...query.orderBy].sort((a, b) => a.field.localeCompare(b.field)) : [],
        expand: query.expand ? [...query.expand].sort() : []
    };
    return JSON.stringify(keyObject);
}


export class DataModelImpl<T> implements DataModel<T> {
    protected status: DataModelStatus = {loading: false, isLastPageReached: false};
    protected queryCache = new Map<string, ReturnedData<T>>();
    protected maxCacheSize = 10;
    totalCount: number | null = null; // Total count might vary based on filters
    private subscription: Subscription;

    public constructor(
        protected _dataSource: DataSource<T>,
    ) {
        this.subscription = this._dataSource.updates().subscribe((x) => {
            if (x.type == "data-updated") {
                this.reset();
            }
        });
    }

    dataSourceEvents(): Observable<DataSourceEvents> {
        return this.dataSource().updates();
    }

    dataSource(): DataSource<T> {
        return this._dataSource;
    }

    getStatus(): DataModelStatus {
        return this.status;
    }

    hasPage(pageNo: number, pageSize: number): boolean {
        if (pageNo === 0) {
            return true; // Always assume page 0 exists
        }
        if (this.totalCount == null || isNaN(this.totalCount)) {
            return false;
        }
        const pageCount = Math.ceil(this.totalCount / pageSize);
        return pageNo < pageCount;
    }

    totalRowCount(): number {
        if (this.totalCount == null || isNaN(this.totalCount)) {
            return 0;
        }
        return this.totalCount;
    }

    // execute(): Observable<DataPushEvent<T>> {
    //     this.debounceTrigger$.next();
    //     return this.debouncedExecution$;
    // }

    async execute(query: IQuery): Promise<ReturnedData<T>> {
        return await this.apply(query);
    }

    private isLastPage(pageNo: number, pageSize: number) {
        if (this.totalCount != null && !isNaN(this.totalCount)) {
            const pageCount = Math.ceil(this.totalCount / pageSize);
            return pageNo + 1 >= pageCount;
        }
        return true;
    }

    // Check if the result for a specific query is cached
    private isCached(queryKey: string): boolean {
        return this.queryCache.has(queryKey);
    }

    // Cache the result for a specific query
    private cacheQueryResult(queryKey: string, data: ReturnedData<T>) {
        if (this.queryCache.size >= this.maxCacheSize) {
            // Evict the oldest entry (Map preserves insertion order)
            const oldestKey = this.queryCache.keys().next().value;
            this.queryCache.delete(oldestKey);
        }
        this.queryCache.set(queryKey, data);
    }

    private async apply(query: IQuery): Promise<ReturnedData<T>> {
        const queryKey = getQueryCacheKey(query);
        const page = query.pageNo ?? 0;
        const pageSize = query.pageSize ?? 10;

        if (this.isCached(queryKey)) {
            // Return cached data, update status if needed
            const cachedResult = this.queryCache.get(queryKey)!;
            this.status.isLastPageReached = cachedResult.isLastPage;
            return cachedResult;
        }

        this.status.loading = true;

        try {
            // Fetch total count only if it's unknown for the current filter context
            if (this.totalCount == null || isNaN(this.totalCount)) {
                this.totalCount = await this._dataSource.totalCount(query);
            }

            // Fetch the actual data
            let rd = await this._dataSource.fetchData(query);
            let data = rd.data;

            // Determine if this is the last page based on fetched data and total count
            const isEmpty = data.length === 0;
            const isLastPageBasedOnFetch = isEmpty || (data.length < pageSize);
            const isLastPageBasedOnTotal = this.isLastPage(page, pageSize);
            const isLastPage = isLastPageBasedOnFetch || isLastPageBasedOnTotal;

            const result: ReturnedData<T> = {
                data: data,
                count: data.length,
                isLastPage: isLastPage
            };

            this.cacheQueryResult(queryKey, result);
            this.status.isLastPageReached = isLastPage;

            return result;
        } catch (error: any) {
            console.error("Error executing query:", error);
            this.status.error = error.message || "fetch error";
            throw error;
        } finally {
            this.status.loading = false;
        }
    }

    reset(): void {
        this.totalCount = null;
        this.queryCache.clear(); // Clear the query cache
        this.status.isLastPageReached = false;
        this.status.loading = false;
        this.status.error = undefined;
    }

    destroy() {
        this.subscription.unsubscribe();
    }

}

