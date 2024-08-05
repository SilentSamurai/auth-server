import {StaticModel} from './StaticModel';
import {DataPushEvents} from './DataModel';
import {EventEmitter} from '@angular/core';
import {Operators} from "./Operator";
import {Filter} from "./Filters";

describe('StaticModel', () => {
    let staticModel: StaticModel;

    beforeEach(() => {
        staticModel = new StaticModel('id');
    });

    it('should create an instance', () => {
        expect(staticModel).toBeTruthy();
    });

    it('should return data pusher event emitter', () => {
        expect(staticModel.dataPusher()).toBeInstanceOf(EventEmitter);
    });

    it('should correctly set and get key field', () => {
        expect(staticModel.getKeyField()).toBe('id');
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
        console.log(testData)
        expect(staticModel.getData()).toEqual(testData);
    });

    it('should emit data push event on apply', async () => {
        const srcOptions = {append: false};
        const spy = spyOn(staticModel.dataPusher(), 'emit');
        await staticModel.apply(srcOptions);
        expect(spy).toHaveBeenCalledWith({
            srcOptions,
            operation: DataPushEvents.UPDATED_DATA,
            data: staticModel.data,
            pageNo: staticModel.getPageNo()
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
        expect(staticModel.getPageSize()).toBe(30);
    });

    it('should set the page size correctly', () => {
        staticModel.pageSize(50);
        expect(staticModel.getPageSize()).toBe(50);
    });

    it('should not change page size if invalid value is provided', () => {
        staticModel.pageSize(-10);
        // Assuming 30 is the default value
        expect(staticModel.getPageSize()).toBe(30);
    });

    it('should emit event with initial data', async () => {
        const spy = spyOn(staticModel.dataPusher(), 'emit');
        await staticModel.apply({});
        expect(spy).toHaveBeenCalledWith({
            srcOptions: {},
            operation: DataPushEvents.UPDATED_DATA,
            data: staticModel.getData(),
            pageNo: staticModel.getPageNo()
        });
    });

    it('should emit event with updated data', async () => {
        const spy = spyOn(staticModel.dataPusher(), 'emit');
        const newData = [{id: 1, name: 'test'}];
        staticModel.setData(newData);
        await staticModel.apply({});
        expect(spy).toHaveBeenCalledWith({
            srcOptions: {},
            operation: DataPushEvents.UPDATED_DATA,
            data: newData,
            pageNo: staticModel.getPageNo()
        });
    });

    it('should emit event with appended data', async () => {
        const spy = spyOn(staticModel.dataPusher(), 'emit');
        const initialData = [{id: 1, name: 'test1'}];
        const newData = [{id: 2, name: 'test2'}];
        staticModel.setData(initialData);
        staticModel.appendData(newData);
        await staticModel.apply({append: true});
        expect(spy).toHaveBeenCalledWith({
            srcOptions: {append: true},
            operation: DataPushEvents.UPDATED_DATA,
            data: [...initialData, ...newData],
            pageNo: staticModel.getPageNo()
        });
    });

    it('should emit event with different operations', async () => {
        const spy = spyOn(staticModel.dataPusher(), 'emit');
        staticModel['apply'] = async (srcOptions: any) => {
            staticModel._dataPusher.emit({
                srcOptions: srcOptions,
                operation: DataPushEvents.START_FETCH,
                data: staticModel.getData(),
                pageNo: staticModel.getPageNo()
            });
            return true;
        };
        await staticModel.apply({});
        expect(spy).toHaveBeenCalledWith({
            srcOptions: {},
            operation: DataPushEvents.START_FETCH,
            data: staticModel.getData(),
            pageNo: staticModel.getPageNo()
        });
    });

    it('should emit event when filters are set', async () => {
        const spy = spyOn(staticModel.dataPusher(), 'emit');
        const filters = [
            new Filter("name", "name", "test", Operators.EQ)
        ];
        staticModel.filter(filters);
        await staticModel.apply({});
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
            data: staticModel.getData()
        }));
        expect(staticModel.getFilters()).toEqual(filters);
    });

    it('should emit event when orderBy is set', async () => {
        const spy = spyOn(staticModel.dataPusher(), 'emit');
        const orderBy = [{field: 'name', direction: 'asc'}];
        staticModel.orderBy(orderBy);
        await staticModel.apply({});
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
            data: staticModel.getData()
        }));
        expect(staticModel.getOrderBy()).toEqual(orderBy);
    });
});
