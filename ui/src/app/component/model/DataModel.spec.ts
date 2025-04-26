import {DataModelImpl} from './DataModelImpl';
import {Filter} from './Filters';
import {Operators} from './Operator';
import {DataModel, DataSourceEvents, Query, SortConfig} from './DataModel';
import {HttpClient} from "@angular/common/http";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {TestBed} from "@angular/core/testing";
import {Subject} from "rxjs";
import {StaticModel} from "./StaticModel";

describe('StaticModel + DataModelImpl (in-memory data source)', () => {
    let dataModel: DataModel<any>;
    const defaultPageSize = 50;
    let httpClient: HttpClient;
    const API_URL = '/api';

    const createDataModel = (initialData: any[]): DataModel<any> => {
        return new DataModelImpl<any>(
            new StaticModel(
                ['id'],
                initialData
            ),
        );
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule]
        });
        httpClient = TestBed.inject(HttpClient);
        dataModel = createDataModel([]);
    });

    it('creates the data model instance', () => {
        expect(dataModel).toBeTruthy();
    });

    it('applies filters to the query', async () => {
        const filters: Filter[] = [new Filter('id', 'id', '42', Operators.EQ)];
        const query = new Query({ filters });
        const result = await dataModel.execute(query);
        expect(result.data).toEqual([]);
    });

    it('updates orderBy on the query', async () => {
        const sort: SortConfig[] = [{field: 'name', order: 'asc'}];
        const query = new Query({ orderBy: sort });
        const result = await dataModel.execute(query);
        expect(result.data).toEqual([]);
    });

    it('sets and retrieves page number', async () => {
        const query = new Query({ pageNo: 3 });
        const result = await dataModel.execute(query);
        expect(result.data).toEqual([]);
    });

    it('hasPage(0) is always true (first page)', () => {
        expect(dataModel.hasPage(0, defaultPageSize)).toBeTrue();
    });

    it('hasPage(>0) is false when totalCount is still unknown', async () => {
        expect(dataModel.hasPage(1, defaultPageSize)).toBeFalse();
    });

    it('hasPage reflects totalCount after the first fetch', async () => {
        const sampleData = [
            {id: 1},
            {id: 2},
            {id: 3},
        ];
        dataModel = createDataModel(sampleData);
        const query = new Query({ pageSize: sampleData.length });
        await dataModel.execute(query);

        expect(dataModel.hasPage(0, sampleData.length)).toBeTrue();
        expect(dataModel.hasPage(1, sampleData.length)).toBeFalse();
    });

    it('has a default pageSize that matches a fresh Query instance', () => {
        const query = new Query({});
        expect(query.pageSize).toBe(defaultPageSize);
    });

    it('totalRowCount() returns 0 until data is fetched', () => {
        expect(dataModel.totalRowCount()).toBe(0);
    });

    it('totalRowCount() matches fetched data size afterwards', async () => {
        const rows = [
            {id: 1, name: 'John'},
            {id: 2, name: 'Jane'},
            {id: 3, name: 'Doe'},
        ];

        dataModel = createDataModel(rows);
        const query = new Query({ pageSize: rows.length });
        await dataModel.execute(query);

        expect(dataModel.totalRowCount()).toBe(rows.length);
    });

    it('correctly processes and returns all data from StaticModel', async () => {
        const sampleData = [
            {id: 1, name: 'Alice', age: 30, active: true, details: {role: 'admin'}, createdAt: new Date('2023-01-01')},
            {id: 2, name: 'Bob', age: 25, active: false, details: {role: 'user'}, createdAt: new Date('2023-01-02')},
            {id: 3, name: 'Charlie', age: 35, active: true, details: {role: 'editor'}, createdAt: new Date('2023-01-03')},
            {id: 4, name: 'Diana', age: 28, active: true, details: {role: 'viewer'}, createdAt: new Date('2023-01-04')},
            {id: 5, name: 'Evan', age: 40, active: false, details: {role: 'guest'}, createdAt: new Date('2023-01-05')},
        ];

        dataModel = createDataModel(sampleData);
        const query = new Query({ pageSize: sampleData.length });
        const result = await dataModel.execute(query);

        expect(result.data).toEqual(sampleData);
        expect(result.isLastPage).toBeTrue();
        expect(dataModel.totalRowCount()).toBe(sampleData.length);
        expect(dataModel.hasPage(0, sampleData.length)).toBeTrue();
        expect(dataModel.hasPage(1, sampleData.length)).toBeFalse();
    });

    it('correctly separates data by different page sizes', async () => {
        const sampleData = [
            {id: 1, name: 'Page1-Item1'},
            {id: 2, name: 'Page1-Item2'},
            {id: 3, name: 'Page2-Item1'},
            {id: 4, name: 'Page2-Item2'},
            {id: 5, name: 'Page3-Item1'}
        ];

        dataModel = createDataModel(sampleData);
        const pageSize = 2;

        // Page 0
        let result = await dataModel.execute(new Query({ pageNo: 0, pageSize }));
        expect(result.data).toEqual(sampleData.slice(0, 2));
        expect(result.isLastPage).toBeFalse();
        expect(dataModel.hasPage(1, pageSize)).toBeTrue();
        expect(dataModel.totalRowCount()).toBe(sampleData.length);

        // Page 1
        result = await dataModel.execute(new Query({ pageNo: 1, pageSize }));
        expect(result.data).toEqual(sampleData.slice(2, 4));
        expect(result.isLastPage).toBeFalse();
        expect(dataModel.hasPage(2, pageSize)).toBeTrue();

        // Page 2 (last page)
        result = await dataModel.execute(new Query({ pageNo: 2, pageSize }));
        expect(result.data).toEqual(sampleData.slice(4));
        expect(result.isLastPage).toBeTrue();
        expect(dataModel.hasPage(3, pageSize)).toBeFalse();
    });

    it('debounces rapid execute calls', async () => {
        const spy = spyOn(dataModel as any, 'apply').and.callThrough();

        // Rapid successive calls
        await dataModel.execute(new Query({}));
        await dataModel.execute(new Query({}));
        await dataModel.execute(new Query({}));

        expect(spy).toHaveBeenCalledTimes(3);
    });

    it('properly handles data source errors', async () => {
        const errorSource = {
            fetchData: () => Promise.reject(new Error('Test error')),
            totalCount: () => Promise.resolve(0),
            keyFields: () => ['id'],
            updates: () => new Subject<DataSourceEvents>()
        };

        dataModel = new DataModelImpl(errorSource);
        try {
            await dataModel.execute(new Query({}));
            fail('Expected error to be thrown');
        } catch (error) {
            expect(error).toBeDefined();
            expect(dataModel.getStatus().error).toBeTruthy();
        }
    });

    it('should invalidate cache when changing sort order', async () => {
        const initialSort: SortConfig[] = [{field: 'name', order: 'asc'}];
        const newSort: SortConfig[] = [{field: 'date', order: 'desc'}];

        const mockDataSource = jasmine.createSpyObj("DataSource", ['fetchData', 'totalCount', "updates"]);
        mockDataSource.updates.and.returnValue(new Subject());

        dataModel = new DataModelImpl(mockDataSource);

        const data = {data: [{id: 1}]};
        // Initial sort and data fetch
        mockDataSource.fetchData.and.resolveTo(data);
        await dataModel.execute(new Query({ orderBy: initialSort }));

        // Change sort order
        await dataModel.execute(new Query({ orderBy: newSort }));

        expect(mockDataSource.fetchData).toHaveBeenCalledTimes(2);
    });

    it('should return cached data without fetching', async () => {
        const mockDataSource = jasmine.createSpyObj('DataSource', ['fetchData', 'totalCount', 'updates']);
        mockDataSource.fetchData.and.resolveTo({data: [{id: 1}]});
        mockDataSource.updates.and.returnValue(new Subject());

        dataModel = new DataModelImpl(mockDataSource);

        await dataModel.execute(new Query({}));
        expect(mockDataSource.fetchData).toHaveBeenCalledTimes(1);

        // Second call should use cache
        await dataModel.execute(new Query({}));
        expect(mockDataSource.fetchData).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination edge cases', async () => {
        const mockDataSource = jasmine.createSpyObj('DataSource', ['fetchData', 'totalCount', 'updates']);
        mockDataSource.updates.and.returnValue(new Subject());

        dataModel = new DataModelImpl(mockDataSource);

        mockDataSource.totalCount.and.resolveTo(0);
        mockDataSource.fetchData.and.resolveTo({data: []});

        const result = await dataModel.execute(new Query({}));
        expect(result.data).toEqual([]);
        expect(result.isLastPage).toBeTrue();
        expect(dataModel.hasPage(0, defaultPageSize)).toBeTrue();
    });

    it('should propagate error states correctly', async () => {
        const mockDataSource = jasmine.createSpyObj('DataSource', ['fetchData', 'totalCount', 'updates']);
        mockDataSource.updates.and.returnValue(new Subject());

        const testError = new Error('Data source failure');
        mockDataSource.fetchData.and.rejectWith(testError);

        dataModel = new DataModelImpl(mockDataSource);

        try {
            await dataModel.execute(new Query({}));
            fail('Expected error to be thrown');
        } catch (error) {
            const status = dataModel.getStatus();
            expect(error).toBeDefined();
            expect(status.error).toBeDefined();
            expect(status.loading).toBeFalse();
        }
    });

    it('should reset internal state correctly', async () => {
        const mockDataSource = jasmine.createSpyObj('DataSource', ['fetchData', 'totalCount', 'updates']);
        mockDataSource.updates.and.returnValue(new Subject());

        mockDataSource.fetchData.and.resolveTo({data: [{id: 1}]});

        dataModel = new DataModelImpl(mockDataSource);

        await dataModel.execute(new Query({}));
        expect(mockDataSource.fetchData).toHaveBeenCalledTimes(1);

        dataModel.reset();
        await dataModel.execute(new Query({}));
        expect(mockDataSource.fetchData).toHaveBeenCalledTimes(2);
    });
});
