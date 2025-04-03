import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppTableComponent } from './app-table.component';
import { DataModel, DataPushEvent, DataPushEventStatus } from '../model/DataModel';
import { Filter } from '../model/Filters';
import { EventEmitter } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { TableColumnComponent } from './app-table-column.component';
import { AppTableButtonComponent } from './app-table-button.component';
import {CheckboxChangeEvent, CheckboxModule} from 'primeng/checkbox';
import { Operators } from "../model/Operator";
import {RadioButton, RadioButtonModule} from "primeng/radiobutton";

describe('AppTableComponent', () => {
    let component: AppTableComponent;
    let fixture: ComponentFixture<AppTableComponent>;
    let mockDataModel: jasmine.SpyObj<DataModel>;
    let mockFilterBar: jasmine.SpyObj<FilterBarComponent>;
    const scrollToEndEvent = {
        target: {
            offsetHeight: 0,
            scrollTop: 1,
            scrollHeight: 0
        }
    };

    beforeEach(async () => {
        mockDataModel = jasmine.createSpyObj('DataModel', [
            'dataPusher', 'getKeyFields', 'filter', 'orderBy', 'pageNo', 'pageSize', 'apply', 'hasPage', 'totalRowCount'
        ]);
        mockDataModel.dataPusher.and.returnValue(new EventEmitter<DataPushEvent>());
        mockDataModel.getKeyFields.and.returnValue(['id']);
        mockDataModel.hasPage.and.returnValue(true);
        mockDataModel.totalRowCount.and.returnValue(0);

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
                TableModule,
                CheckboxModule,
                RadioButtonModule,
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
        component.actualRows = [{id: 1}, {id: 2}, {id: 3}];
        component.selectedItem = ['1', '2'];
        expect(spy).toHaveBeenCalledWith([{id: 1}, {id: 2}]);

        component.selectedItem = '1';
        expect(spy).toHaveBeenCalledWith([{id: 1}]);
    });

    it('should handle DataPushEvent with UPDATED_DATA operation', () => {
        const event: DataPushEvent = {
            srcOptions: {append: false},
            operation: DataPushEventStatus.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(event);
        expect(component.actualRows).toEqual(event.data!);
    });

    it('should handle DataPushEvent with START_FETCH operation', () => {
        const event: DataPushEvent = {
            srcOptions: {},
            operation: DataPushEventStatus.START_FETCH,
            data: null,
            pageNo: null
        };

        component.dataPushEventHandler(event);
        expect(component.loading).toBeTrue();
    });

    it('should handle DataPushEvent with END_FETCH operation', () => {
        const event: DataPushEvent = {
            srcOptions: {},
            operation: DataPushEventStatus.END_FETCH,
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
            operation: DataPushEventStatus.UPDATED_DATA,
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
        component.selectedItem = ['1', '2'];
        fixture.detectChanges();

        // Check if the selectionChange event is emitted with the correct value
        component.selectionChange.subscribe(selected => {
            expect(selected).toEqual([mockRow1, mockRow2]);
        });

        // Verify that the selectedItem property is correctly set
        expect(component.selectedItem).toEqual(['1', '2']);
    });

    it('should handle multi set to false correctly', () => {
        // Set the multi input property to false
        component.multi = false;
        fixture.detectChanges();

        // Check if the component's behavior matches the expected behavior for single selection mode
        expect(component.multi).toBeFalse();

        // Simulate a selection
        const mockRow = {id: 1, name: 'Row 1'};
        component.selectedItem = '1';
        fixture.detectChanges();

        // Check if the selectionChange event is emitted with the correct value
        component.selectionChange.subscribe(selected => {
            expect(selected).toEqual([mockRow]);
        });

        // Verify that the selectedItem property is correctly set
        expect(component.selectedItem).toEqual('1');
    });

    it('should request next page with lazyLoad', () => {
        // const spy = spyOn(component, 'requestForData').and.callThrough();

        // component.lazyLoad(scrollToEndEvent);
        //
        // expect(mockDataModel.hasPage).toHaveBeenCalledWith(0);
        // expect(mockDataModel.pageNo).toHaveBeenCalledWith(0);
        // expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});

        let setDataEvent: DataPushEvent = {
            srcOptions: {append: true},
            operation: DataPushEventStatus.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(setDataEvent);
        expect(component.actualRows).toEqual(setDataEvent.data!);

        component.lazyLoad(scrollToEndEvent);

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(1);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(1);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});


        let appDataEvent: DataPushEvent = {
            srcOptions: {append: true},
            operation: DataPushEventStatus.UPDATED_DATA,
            data: [{id: 2, name: 'test2'}],
            pageNo: 1
        };

        component.dataPushEventHandler(appDataEvent);
        expect(component.actualRows).toEqual([...setDataEvent.data!, ...appDataEvent.data!])

        // expect(spy).toHaveBeenCalledWith({append: true});

        component.lazyLoad(scrollToEndEvent);

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
            operation: DataPushEventStatus.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(setDataEvent);
        expect(component.actualRows).toEqual(setDataEvent.data!);

        component.lazyLoad(scrollToEndEvent);

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(1);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(1);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});


        let appDataEvent: DataPushEvent = {
            srcOptions: {append: true},
            operation: DataPushEventStatus.UPDATED_DATA,
            data: [{id: 2, name: 'test2'}],
            pageNo: 1
        };

        component.dataPushEventHandler(appDataEvent);
        expect(component.actualRows).toEqual([...setDataEvent.data!, ...appDataEvent.data!])

        component.lazyLoad(scrollToEndEvent);

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
            operation: DataPushEventStatus.UPDATED_DATA,
            data: [{id: 1, name: 'test'}],
            pageNo: 0
        };

        component.dataPushEventHandler(setDataEvent);
        expect(component.actualRows).toEqual(setDataEvent.data!);

        // scroll event
        component.lazyLoad(scrollToEndEvent);

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(1);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(1);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});


        let appDataEvent: DataPushEvent = {
            srcOptions: {append: true},
            operation: DataPushEventStatus.UPDATED_DATA,
            data: [{id: 2, name: 'test2'}],
            pageNo: 1
        };

        component.dataPushEventHandler(appDataEvent);
        expect(component.actualRows).toEqual([...setDataEvent.data!, ...appDataEvent.data!])

        component.lazyLoad(scrollToEndEvent);

        expect(mockDataModel.hasPage).toHaveBeenCalledWith(2);
        expect(mockDataModel.pageNo).toHaveBeenCalledWith(2);
        expect(mockDataModel.apply).toHaveBeenCalledWith({append: true});

    });

});
