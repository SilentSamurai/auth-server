import {Filter} from './Filters';
import {BaseDataSource, ReturnedData} from "./DataSource";
import {Query, SortConfig} from "./Query";

export class StaticSource<T> extends BaseDataSource<T> {
    private data: T[] = [];

    constructor(keyFields: string[], initialData: T[] = []) {
        super(keyFields);
        this.data = [...initialData];
    }

    setData(data: T[]): void {
        this.data = [...data];
        this.eventSubject.next({type: 'data-updated', source: 'set'});
    }

    appendData(newData: T[]): void {
        this.data.push(...newData);
        this.eventSubject.next({type: 'data-updated', source: 'append'});
    }

    async queryData(query: Query): Promise<ReturnedData<T>> {
        const start =
            (query.pageNo ?? 0) * (query.pageSize ?? this.data.length);
        const end = start + (query.pageSize ?? this.data.length);

        let filteredData = this.applyFilters(this.data, query.filters ?? []);
        let sortedData = this.applySorting(filteredData, query.orderBy ?? []);

        let result = sortedData.slice(start, end);
        return {
            data: result,
            count: result.length,
        };
    }

    queryCount(query: Query): Promise<number> {
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
