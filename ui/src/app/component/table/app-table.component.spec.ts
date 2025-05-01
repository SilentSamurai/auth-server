import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AppTableComponent} from './app-table.component';
import {Component, ViewChild} from '@angular/core';
import {CheckboxModule} from 'primeng/checkbox';
import {RadioButtonModule} from 'primeng/radiobutton';
import {SkeletonModule} from 'primeng/skeleton';
import {FormsModule} from '@angular/forms';
import {ComponentModule} from '../component.module';
import {StaticSource} from "../model/StaticSource";

function timeout(ms: number): Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

@Component({
    template: `
        <app-table [dataSource]="dataSource" [title]="'Test Table'">
            <ng-template #table_body let-row>
                <td>{{ row.name }}</td>
            </ng-template>
        </app-table>
    `,
})
class TestHostComponent {
    dataSource = new StaticSource(['id'], [{id: 1, name: 'Item 1'}]);

    @ViewChild(AppTableComponent) tableComponent!: AppTableComponent;
}

describe('AppTableComponent', () => {
    let component: AppTableComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                CheckboxModule,
                RadioButtonModule,
                SkeletonModule,
                ComponentModule,
            ],
            declarations: [TestHostComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        component = fixture.componentInstance.tableComponent;
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
        expect(component).toBeTruthy();
    });

    // it('should load data on init', fakeAsync(async () => {
    //     spyOn(component, 'requestForData').and.callThrough();
    //     await component.ngOnInit();
    //     fixture.detectChanges();
    //     expect(component.requestForData).toHaveBeenCalled();
    //     expect(component.actualRows.length).toBe(1);
    // }));
    //
    // it('should refresh data on refresh button click', fakeAsync(() => {
    //     spyOn(component, 'refresh').and.callThrough();
    //     const refreshButton = fixture.debugElement.query(By.css('.pi-refresh')).nativeElement;
    //     refreshButton.click();
    //     tick();
    //     expect(component.refresh).toHaveBeenCalled();
    // }));
    //
    // it('should emit selectionChange on item selection (multi=true)', () => {
    //     component.multi = true;
    //     component.actualRows = [{id: 1, name: 'Item 1'}];
    //     fixture.detectChanges();
    //
    //     const selectionSpy = spyOn(component.selectionChange, 'emit');
    //     component.selectedItem = ['1'];
    //     fixture.detectChanges();
    //
    //     expect(component.selection.length).toBe(1);
    //     expect(selectionSpy).toHaveBeenCalledWith([{id: 1, name: 'Item 1'}]);
    // });
    //
    // it('should select all items when select all checkbox is clicked', () => {
    //     component.multi = true;
    //     component.actualRows = [
    //         {id: 1, name: 'Item 1'},
    //         {id: 2, name: 'Item 2'}
    //     ];
    //     fixture.detectChanges();
    //
    //     component.onSelectAll({checked: true} as any);
    //     expect(component.selection.length).toBe(2);
    //     expect(component._selectAll).toBeTrue();
    // });
    //
    // it('should lazy load more data on scroll', fakeAsync(() => {
    //     spyOn(component, 'requestForData').and.callThrough();
    //     const fakeScrollEvent = {
    //         target: {
    //             offsetHeight: 500,
    //             scrollTop: 500,
    //             scrollHeight: 1000
    //         }
    //     };
    //     component.lazyLoad(fakeScrollEvent);
    //     tick();
    //     expect(component.requestForData).toHaveBeenCalled();
    // }));
    //
    // it('should handle filtering', fakeAsync(() => {
    //     spyOn(component, 'requestForData').and.callThrough();
    //     component.filter([new Filter("name", "", "Item 1", Operators.EQ)]);
    //     tick();
    //     expect(component.requestForData).toHaveBeenCalled();
    // }));
    //
    // it('should unsubscribe from subscriptions on destroy', () => {
    //     const unsubscribeSpy = spyOn(component['_subscriptions'], 'unsubscribe');
    //     component.ngOnDestroy();
    //     expect(unsubscribeSpy).toHaveBeenCalled();
    // });
});
