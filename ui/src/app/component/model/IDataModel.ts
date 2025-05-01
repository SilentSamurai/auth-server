import {Observable} from 'rxjs';
import {DataSource, DataSourceEvents, ReturnedData} from "./DataSource";
import {Query} from "./Query";

export interface DataModelStatus {
    loading: boolean;
    error?: string;
    isLastPageReached: boolean;
}

export interface IDataModel<T> {
    execute(query: Query): Promise<ReturnedData<T>>;

    hasPage(pageNo: number, pageSize: number): boolean;

    getStatus(): DataModelStatus;

    totalRowCount(): number;

    reset(): void;

    dataSource(): DataSource<T>;

    dataSourceEvents(): Observable<DataSourceEvents>;
}
