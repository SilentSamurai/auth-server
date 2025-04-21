import {RestApiModel} from './RestApiModel';
import {HttpClient} from '@angular/common/http';
import {of, throwError} from 'rxjs';
import {DataPushEventStatus, SortConfig} from './DataModel';
import {Filter} from './Filters';
import {Operators} from './Operator'; // Assuming Operator is imported from a module

describe('RestApiModel', () => {
    let restApiModel: RestApiModel<any>;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;

    beforeEach(() => {
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['post']);
        restApiModel = new RestApiModel(httpClientSpy, '/api/data', ['id'], []);
    });

    it('should create an instance', () => {
        expect(restApiModel).toBeTruthy();
    });

    it('should emit events when apply is called', async () => {
        const spy = spyOn(restApiModel.dataPusher(), 'emit');
        httpClientSpy.post.and.returnValue(of({data: [], totalCount: 0}));

        await restApiModel.apply({});

        expect(spy.calls.allArgs()).toEqual([
            [{
                srcOptions: {},
                operation: DataPushEventStatus.START_FETCH,
                data: null,
                pageNo: null,
                error: undefined,
            }],
            [{
                srcOptions: {},
                operation: DataPushEventStatus.UPDATED_DATA,
                data: [],
                pageNo: 0,
                error: undefined,
            }],
            [{
                srcOptions: {},
                operation: DataPushEventStatus.END_FETCH,
                data: null,
                pageNo: null,
                error: undefined,
            }]
        ]);
    });

    it('should emit src options', async () => {
        const spy = spyOn(restApiModel.dataPusher(), 'emit');
        httpClientSpy.post.and.returnValue(of({data: [], totalCount: 0}));

        await restApiModel.apply({append: true});

        expect(spy.calls.allArgs()).toEqual([
            [{
                srcOptions: {},
                operation: DataPushEventStatus.START_FETCH,
                data: null,
                pageNo: null,
                error: undefined,
            }],
            [{
                srcOptions: {append: true},
                operation: DataPushEventStatus.UPDATED_DATA,
                data: [],
                pageNo: 0,
                error: undefined,
            }],
            [{
                srcOptions: {},
                operation: DataPushEventStatus.END_FETCH,
                data: null,
                pageNo: null,
                error: undefined,
            }]
        ]);
    });

    it('should set data and totalCount when apply is called', async () => {
        const mockResponse = {data: [{id: 1, name: 'test'}]};
        const countResponse = {count: 1};
        httpClientSpy.post.and.returnValues(of(countResponse), of(mockResponse));

        await restApiModel.apply({});

        expect(restApiModel.getData()).toEqual(mockResponse.data);
        expect(restApiModel.totalRowCount()).toBe(countResponse.count);
    });

    it('should handle API errors correctly', async () => {
        const spy = spyOn(restApiModel.dataPusher(), 'emit');
        const error = new Error('API Error');
        httpClientSpy.post.and.returnValue(throwError(() => error));

        await restApiModel.apply({});

        expect(spy.calls.allArgs()).toEqual([
            [{
                srcOptions: {},
                operation: DataPushEventStatus.START_FETCH,
                data: null,
                pageNo: null,
                error: undefined,
            }],
            [{
                srcOptions: {},
                operation: DataPushEventStatus.UPDATED_DATA,
                data: null,
                pageNo: 0,
                error: error
            }],
            [{
                srcOptions: {},
                operation: DataPushEventStatus.END_FETCH,
                data: null,
                pageNo: null,
                error: undefined,
            }]
        ]);
    });

    it('should update filters correctly', () => {
        const filters: Filter[] = [
            new Filter('name', 'Name', 'test', Operators.EQ)
        ];
        restApiModel.filter(filters);

        expect(restApiModel.getFilters()).toEqual(filters);
    });

    it('should return correct page size', () => {
        restApiModel.pageSize(50);

        expect(restApiModel.getPageSize()).toBe(50);
    });

    it('should update page number correctly', () => {
        restApiModel.pageNo(2);

        expect(restApiModel.getPageNo()).toBe(2);
    });

    it('should return true for hasPage if totalCount is null', () => {
        httpClientSpy.post.and.returnValue(of({data: [], count: 0}));
        restApiModel.apply({});

        restApiModel.filter([new Filter('test', 'Test', 'value', Operators.EQ)]);
        httpClientSpy.post.and.returnValue(of({data: [], count: 0}));
        restApiModel.apply({});

        expect(restApiModel.hasPage(1)).toBeTrue();
    });

    it('should handle pagination correctly', async () => {
        // Test case 1: No more pages available
        httpClientSpy.post.and.returnValue(of({data: [], count: 30}));
        restApiModel.pageSize(10);
        await restApiModel.apply({});
        expect(restApiModel.hasNextPage(2)).toBeFalse(); // Page 3 doesn't exist (30 items / 10 per page = 3 pages)

        // Test case 2: More pages available
        expect(restApiModel.hasNextPage(1)).toBeTrue(); // Page 2 exists

        // Test case 3: Last page
        expect(restApiModel.hasNextPage(0)).toBeTrue(); // Page 1 exists

    });

    it('should handle pagination edge case correctly', async () => {
        // Test case 4: Edge case - empty result set
        httpClientSpy.post.and.returnValue(of({data: [], count: 0}));
        await restApiModel.apply({});
        expect(restApiModel.hasNextPage(0)).toBeFalse(); // No pages when count is 0
    });

    it('should update orderBy correctly', () => {
        const orderBy: SortConfig[] = [{field: 'name', order: 'asc'}];
        restApiModel.orderBy(orderBy);

        expect(restApiModel.getOrderBy()).toEqual(orderBy);
    });

    it('should update expand options correctly', () => {
        const expand = ['details'];
        restApiModel.expands(expand);

        expect(restApiModel.getExpand()).toEqual(expand);
    });

    it('should emit event when filters are set', async () => {
        const spy = spyOn(restApiModel.dataPusher(), 'emit');
        const filters: Filter[] = [
            new Filter('name', 'Name', 'test', Operators.EQ)
        ];

        const newData = [{id: 1, name: 'test'}]

        httpClientSpy.post.and.returnValue(of({data: newData, totalCount: 1}));

        restApiModel.filter(filters);
        await restApiModel.apply({});

        expect(httpClientSpy.post).toHaveBeenCalledWith("/api/data", jasmine.objectContaining({
            where: filters.map(i => i.toJSON())
        }), jasmine.any(Object))

        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
            operation: DataPushEventStatus.UPDATED_DATA,
            data: newData
        }));
    });

    it('should emit event when orderBy is set', async () => {
        const spy = spyOn(restApiModel.dataPusher(), 'emit');
        const orderBy: SortConfig[] = [{field: 'name', order: 'asc'}];
        const newData = [{id: 1, name: 'test'}]

        httpClientSpy.post.and.returnValue(of({data: newData, totalCount: 1}));

        restApiModel.orderBy(orderBy);
        await restApiModel.apply({});

        expect(httpClientSpy.post).toHaveBeenCalledWith("/api/data", jasmine.objectContaining({
            orderBy: orderBy
        }), jasmine.any(Object))

        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
            operation: DataPushEventStatus.UPDATED_DATA,
            data: newData
        }));
    });
});
