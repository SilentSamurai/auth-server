import {RestApiModel} from './RestApiModel';
import {HttpClient} from '@angular/common/http';
import {of} from 'rxjs';
import {DataPushEventStatus} from './DataModel';
import {Filter} from './Filters';
import {Operators} from './Operator'; // Assuming Operator is imported from a module

describe('RestApiModel', () => {
    let restApiModel: RestApiModel;
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
                pageNo: null
            }],
            [{
                srcOptions: {},
                operation: DataPushEventStatus.UPDATED_DATA,
                data: [],
                pageNo: 0
            }],
            [{
                srcOptions: {},
                operation: DataPushEventStatus.END_FETCH,
                data: null,
                pageNo: null
            }]
        ]);
    });

    it('should set data and totalCount when apply is called', async () => {
        const mockResponse = {data: [{id: 1, name: 'test'}]};
        const countResponse = {count: 1};
        httpClientSpy.post.and.returnValues(of(countResponse), of(mockResponse) );

        await restApiModel.apply({});

        expect(restApiModel.getData()).toEqual(mockResponse.data);
        expect(restApiModel.totalCount).toBe(countResponse.count);
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
        restApiModel.totalCount = null;

        expect(restApiModel.hasPage(1)).toBeTrue();
    });

    it('should return false for hasNextPage if there are no more pages', () => {
        restApiModel.totalCount = 30;
        restApiModel.pageSize(10);

        expect(restApiModel.hasNextPage(2)).toBeFalse();
    });

    it('should return true for hasNextPage if there are more pages', () => {
        restApiModel.totalCount = 30;
        restApiModel.pageSize(10);

        expect(restApiModel.hasNextPage(1)).toBeTrue();
    });

    it('should update orderBy correctly', () => {
        const orderBy = [{field: 'name', direction: 'asc'}];
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
        const orderBy = [{field: 'name', direction: 'asc'}];
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
