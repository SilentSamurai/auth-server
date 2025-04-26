import {
    DataSource,
    DataSourceEvents,
    Query,
    ReturnedData,
    SortConfig,
} from './IDataModel';
import { Filter } from './Filters';
import { Observable, Subject } from 'rxjs';

export class StaticModel<T> implements DataSource<T> {
    private data: T[] = [];
    private eventSubject = new Subject<DataSourceEvents>();

    constructor(
        protected _keyFields: string[],
        initialData: T[] = [],
    ) {
        this.data = [...initialData];
    }

    updates(): Observable<DataSourceEvents> {
        return this.eventSubject;
    }

    keyFields(): string[] {
        return this._keyFields;
    }

    setData(data: T[]): void {
        this.data = [...data];
        this.eventSubject.next({ type: 'data-updated', source: 'set' });
    }

    appendData(newData: T[]): void {
        this.data.push(...newData);
        this.eventSubject.next({ type: 'data-updated', source: 'append' });
    }

    async fetchData(query: Query): Promise<ReturnedData<T>> {
        const start =
            (query.pageNo ?? 0) * (query.pageSize ?? this.data.length);
        const end = start + (query.pageSize ?? this.data.length);

        let filteredData = this.applyFilters(this.data, query.filters ?? []);
        let sortedData = this.applySorting(filteredData, query.orderBy ?? []);

        let result = sortedData.slice(start, end);
        return {
            data: result,
            count: result.length,
            isLastPage: end >= filteredData.length,
        };
    }

    totalCount(query: Query): Promise<number> {
        return Promise.resolve(this.data.length);
    }

    private applyFilters(data: T[], filters: Filter[]): T[] {
        return data.filter((item) => {
            return filters.every((filter) => {
                const value = this.getNestedValue(item, filter.field);
                return filter.matches(value);
            });
        });
    }

    private applySorting(data: T[], orderBy: SortConfig[]): T[] {
        const sortedData = [...data];

        sortedData.sort((a, b) => {
            for (const sort of orderBy) {
                const aValue = this.getNestedValue(a, sort.field);
                const bValue = this.getNestedValue(b, sort.field);
                const direction = sort.order === 'asc' ? 1 : -1;

                if (aValue === bValue) continue;
                if (aValue === null || aValue === undefined) return direction;
                if (bValue === null || bValue === undefined) return -direction;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return direction * aValue.localeCompare(bValue);
                }

                return direction * (aValue < bValue ? -1 : 1);
            }
            return 0;
        });

        return sortedData;
    }

    private getNestedValue(obj: any, path: string): any {
        return path
            .split('.')
            .reduce(
                (acc, part) =>
                    acc && acc[part] !== undefined ? acc[part] : null,
                obj,
            );
    }
}
