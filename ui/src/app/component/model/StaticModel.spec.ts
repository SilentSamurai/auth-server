import {StaticModel} from './StaticModel';
import {DataPushEventStatus, Query, SortConfig} from './DataModel';
import {EventEmitter} from '@angular/core';
import {Operators} from "./Operator";
import {Filter} from "./Filters";

describe('StaticModel', () => {
    let staticModel: StaticModel<any>;

    beforeEach(() => {
        staticModel = new StaticModel(['id']);
    });

    it('should create an instance', () => {
        expect(staticModel).toBeTruthy();
    });

    it('should return data pusher event emitter', () => {
        expect(staticModel.dataPusher()).toBeInstanceOf(EventEmitter);
    });

    it('should correctly set and get key field', () => {
        expect(staticModel.getKeyFields()).toEqual(['id']);
    });

    it('should correctly filter data', () => {
        const filters: Filter[] = [
            new Filter("id", "id", "1", Operators.EQ),
        ];
        staticModel.filter(filters);
        expect(staticModel.getFilters()).toEqual(filters);
    });

    it('should correctly order data', () => {
        const orderBy: any[] = [{field: 'name', direction: 'asc'}];
        staticModel.orderBy(orderBy);
        expect(staticModel.getOrderBy()).toEqual(orderBy);
    });

    it('should correctly set and get page number', () => {
        staticModel.pageNo(2);
        expect(staticModel.getPageNo()).toBe(2);
    });

    it('should correctly set and get page size', () => {
        staticModel.pageSize(50);
        expect(staticModel.getPageSize()).toBe(50);
    });

    it('should return the data', () => {
        const data = [{id: 1, name: 'test'}];
        staticModel.setData(data);
        expect(staticModel.getData()).toEqual(data);
    });

    it('should append data correctly', () => {
        const initialData = [{id: 1, name: 'test1'}];
        const newData = [{id: 2, name: 'test2'}];
        staticModel.setData(initialData);
        staticModel.appendData(newData);
        const testData = [...initialData, ...newData];
        expect(staticModel.getData()).toEqual(testData);
    });

    it('should emit data push event on apply', async () => {
        const srcOptions = {append: false};
        const spy = spyOn(staticModel.dataPusher(), 'emit');
        await staticModel.apply(srcOptions);
        expect(spy).toHaveBeenCalledWith({
            srcOptions,
            operation: DataPushEventStatus.UPDATED_DATA,
            data: staticModel.getData(),
            pageNo: staticModel.getPageNo(),
            error: undefined
        });
    });

    it('should return true for hasPage(0)', () => {
        expect(staticModel.hasPage(0)).toBeTrue();
    });

    it('should return false for hasPage(1)', () => {
        expect(staticModel.hasPage(1)).toBeFalse();
    });

    it('should return false for hasNextPage(0)', () => {
        expect(staticModel.hasNextPage(0)).toBeFalse();
    });

    it('should have a default page size', () => {
        expect(staticModel.getPageSize()).toBe(new Query().pageSize);
    });

    it('should set the page size correctly', () => {
        staticModel.pageSize(50);
        expect(staticModel.getPageSize()).toBe(50);
    });

    it('should not change page size if invalid value is provided', () => {
        staticModel.pageSize(-10);
        expect(staticModel.getPageSize()).toBe(new Query().pageSize);
    });

    it('should return the total row count', () => {
        const data = [
            {id: 1, name: 'test1'},
            {id: 2, name: 'test2'},
            {id: 3, name: 'test3'}
        ];
        staticModel.setData(data);
        expect(staticModel.totalRowCount()).toBe(3);
    });

    it('should sort data when orderBy is set', async () => {
        const data = [
            {id: 1, name: 'Charlie'},
            {id: 2, name: 'Alice'},
            {id: 3, name: 'Bob'}
        ];
        staticModel.setData(data);

        const orderBy: SortConfig[] = [{field: 'name', order: 'asc'}];
        staticModel.orderBy(orderBy);

        await staticModel.apply({});

        const sortedData = [
            {id: 2, name: 'Alice'},
            {id: 3, name: 'Bob'},
            {id: 1, name: 'Charlie'}
        ];

        expect(staticModel.getData()).toEqual(sortedData);
    });

    it('should clear cache when data is updated', () => {
        const data = [
            {id: 1, name: 'Charlie'},
            {id: 2, name: 'Alice'},
            {id: 3, name: 'Bob'}
        ];
        staticModel.setData(data);

        // First sort
        const orderBy: SortConfig[] = [{field: 'name', order: 'asc'}];
        staticModel.orderBy(orderBy);
        staticModel.apply({});

        // Change data
        const newData = [
            {id: 4, name: 'David'},
            {id: 5, name: 'Eve'}
        ];
        staticModel.setData(newData);

        // Sort again with same orderBy
        staticModel.apply({});

        // Should be sorted correctly
        const sortedData = [
            {id: 4, name: 'David'},
            {id: 5, name: 'Eve'}
        ];

        expect(staticModel.getData()).toEqual(sortedData);
    });

    it('should handle nested properties in sorting', async () => {
        const data = [
            {id: 1, user: {name: 'Charlie'}},
            {id: 2, user: {name: 'Alice'}},
            {id: 3, user: {name: 'Bob'}}
        ];
        staticModel.setData(data);

        const orderBy: SortConfig[] = [{field: 'user.name', order: 'asc'}];
        staticModel.orderBy(orderBy);

        await staticModel.apply({});

        const sortedData = [
            {id: 2, user: {name: 'Alice'}},
            {id: 3, user: {name: 'Bob'}},
            {id: 1, user: {name: 'Charlie'}}
        ];

        expect(staticModel.getData()).toEqual(sortedData);
    });
});
