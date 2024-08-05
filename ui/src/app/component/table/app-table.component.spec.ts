import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AppTableComponent} from './app-table.component';
import {DataModel, DataPushEvent, DataPushEvents} from '../model/DataModel';
import {Filter} from '../model/Filters';
import {EventEmitter} from '@angular/core';
import {Table, TableModule} from 'primeng/table';
import {FilterBarComponent} from '../filter-bar/filter-bar.component';
import {TableColumnComponent} from './app-table-column.component';
import {AppTableButtonComponent} from './app-table-button.component';
import {Operators} from "../model/Operator";

describe('AppTableComponent', () => {
    let component: AppTableComponent;
    let fixture: ComponentFixture<AppTableComponent>;
    let mockDataModel: jasmine.SpyObj<DataModel>;
    let mockFilterBar: jasmine.SpyObj<FilterBarComponent>;

    beforeEach(async () => {
        mockDataModel = jasmine.createSpyObj('DataModel', [
            'dataPusher', 'getKeyField', 'filter', 'orderBy', 'pageNo', 'pageSize', 'apply', 'hasPage'
        ]);
        mockDataModel.dataPusher.and.returnValue(new EventEmitter<DataPushEvent>());
        mockDataModel.getKeyField.and.returnValue('id');
        mockDataModel.hasPage.and.returnValue(true);

        mockFilterBar = jasmine.createSpyObj('FilterBarComponent', ['filters']);

        await TestBed.configureTestingModule({
            declarations: [
                AppTableComponent,
                TableColumnComponent,
                AppTableButtonComponent,
                FilterBarComponent,
                Table
            ],
            providers: [],
            imports: [
                TableModule
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AppTableComponent);
        component = fixture.componentInstance;
        component.filterBar = mockFilterBar as unknown as FilterBarComponent; // Set mock FilterBarComponent
        component.dataModel = mockDataModel;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should handle dataModel input correctly', () => {
        const spy = spyOn(mockDataModel.dataPusher(), 'subscribe').and.callThrough();

        component.dataModel = mockDataModel;

        expect(component.dataModel).toBe(mockDataModel);
        expect(spy).toHaveBeenCalled();
    });

    it('should emit selectionChange event when selectedItem is set', () => {
        const spy = spyOn(component.selectionChange, 'emit');

        component.selectedItem = [1, 2, 3];
        expect(spy).toHaveBeenCalledWith([1, 2, 3]);

        component.selectedItem = 4;
        expect(spy).toHaveBeenCalledWith([4]);
    });

    it('should handle DataPushEvent with UPDATED_DATA operation', () => {
        const event: DataPushEvent = {
            srcOptions: {append: false},
            operation: DataPushEvents.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(event);
        expect(component.actualRows).toEqual(event.data!);
    });

    it('should handle DataPushEvent with START_FETCH operation', () => {
        const event: DataPushEvent = {
            srcOptions: {},
            operation: DataPushEvents.START_FETCH,
            data: null,
            pageNo: null
        };

        component.dataPushEventHandler(event);
        expect(component.loading).toBeTrue();
    });

    it('should handle DataPushEvent with END_FETCH operation', () => {
        const event: DataPushEvent = {
            srcOptions: {},
            operation: DataPushEvents.END_FETCH,
            data: null,
            pageNo: null
        };

        component.dataPushEventHandler(event);
        expect(component.loading).toBeFalse();
    });

    it('should request data with filters on filter method call', async () => {

        const filters: Filter[] = [
            new Filter('name', 'Name', 'test', Operators.EQ)
        ];

        await component.filter(filters);

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(0);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(0);
        expect(mockDataModel.filter).toHaveBeenCalledWith(filters);
        expect(mockDataModel.apply).toHaveBeenCalledWith({pageNo: 0, filters, append: false});

    });

    it('should reset data to page 0', async () => {

        await component.reset();

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(0);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(0);
        expect(mockDataModel.apply).toHaveBeenCalledWith({pageNo: 0, append: false});

        let setDataEvent: DataPushEvent = {
            srcOptions: {append: false},
            operation: DataPushEvents.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(setDataEvent);
        expect(component.actualRows).toEqual(setDataEvent.data!);


    });

    it('should handle multi set to true correctly', () => {
        // Set the multi input property to true
        component.multi = true;
        fixture.detectChanges();

        // Check if the component's behavior matches the expected behavior for multi selection mode
        expect(component.multi).toBeTrue();

        // Simulate a selection
        const mockRow1 = {id: 1, name: 'Row 1'};
        const mockRow2 = {id: 2, name: 'Row 2'};
        component.selectedItem = [mockRow1, mockRow2];
        fixture.detectChanges();

        // Check if the selectionChange event is emitted with the correct value
        component.selectionChange.subscribe(selected => {
            expect(selected).toEqual([mockRow1, mockRow2]);
        });

        // Verify that the selectedItem property is correctly set
        expect(component.selectedItem).toEqual([mockRow1, mockRow2]);
    });

    it('should handle multi set to false correctly', () => {
        // Set the multi input property to false
        component.multi = false;
        fixture.detectChanges();

        // Check if the component's behavior matches the expected behavior for single selection mode
        expect(component.multi).toBeFalse();

        // Simulate a selection
        const mockRow = {id: 1, name: 'Row 1'};
        component.selectedItem = mockRow;
        fixture.detectChanges();

        // Check if the selectionChange event is emitted with the correct value
        component.selectionChange.subscribe(selected => {
            expect(selected).toEqual([mockRow]);
        });

        // Verify that the selectedItem property is correctly set
        expect(component.selectedItem).toEqual([mockRow]);
    });


    it('should request next page with lazyLoad', () => {
        // const spy = spyOn(component, 'requestForData').and.callThrough();
        const event = {} as any;

        component.lazyLoad(event);

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(0);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(0);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});

        let setDataEvent: DataPushEvent = {
            srcOptions: {append: true},
            operation: DataPushEvents.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(setDataEvent);
        expect(component.actualRows).toEqual(setDataEvent.data!);

        component.lazyLoad(event);

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(1);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(1);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});


        let appDataEvent: DataPushEvent = {
            srcOptions: {append: true},
            operation: DataPushEvents.UPDATED_DATA,
            data: [{id: 2, name: 'test2'}],
            pageNo: 1
        };

        component.dataPushEventHandler(appDataEvent);
        expect(component.actualRows).toEqual([...setDataEvent.data!, ...appDataEvent.data!])

        // expect(spy).toHaveBeenCalledWith({append: true});

        component.lazyLoad({});

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(2);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(2);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});


    });

    it('should reset data to page 0 then lazy load', async () => {

        await component.reset();

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(0);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(0);
        expect(mockDataModel.apply).toHaveBeenCalledWith({pageNo: 0, append: false});

        let setDataEvent: DataPushEvent = {
            srcOptions: {append: false},
            operation: DataPushEvents.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(setDataEvent);
        expect(component.actualRows).toEqual(setDataEvent.data!);

        component.lazyLoad({});

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(1);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(1);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});


        let appDataEvent: DataPushEvent = {
            srcOptions: {append: true},
            operation: DataPushEvents.UPDATED_DATA,
            data: [{id: 2, name: 'test2'}],
            pageNo: 1
        };

        component.dataPushEventHandler(appDataEvent);
        expect(component.actualRows).toEqual([...setDataEvent.data!, ...appDataEvent.data!])

        component.lazyLoad({});

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(2);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(2);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});


    });

    it('should request data with filters then lazy load', async () => {

        const filters: Filter[] = [
            new Filter('name', 'Name', 'test', Operators.EQ)
        ];

        await component.filter(filters);

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(0);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(0);
        expect(mockDataModel.filter).toHaveBeenCalledWith(filters);
        expect(mockDataModel.apply).toHaveBeenCalledWith({pageNo: 0, filters, append: false});

        let setDataEvent: DataPushEvent = {
            srcOptions: {append: false},
            operation: DataPushEvents.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(setDataEvent);
        expect(component.actualRows).toEqual(setDataEvent.data!);

        // scroll event
        component.lazyLoad({});

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(1);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(1);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});


        let appDataEvent: DataPushEvent = {
            srcOptions: {append: true},
            operation: DataPushEvents.UPDATED_DATA,
            data: [{id: 2, name: 'test2'}],
            pageNo: 1
        };

        component.dataPushEventHandler(appDataEvent);
        expect(component.actualRows).toEqual([...setDataEvent.data!, ...appDataEvent.data!])

        component.lazyLoad({});

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(2);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(2);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});

    });

});
