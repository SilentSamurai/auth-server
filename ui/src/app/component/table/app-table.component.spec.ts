import {async, TestBed} from '@angular/core/testing';

import {TableColumnComponent} from "./app-table-column.component";
import {AppTableComponent} from "./app-table.component";
import {AppComponent} from "../../app.component";
import {TableModule} from "primeng/table";

describe('AppTableComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppTableComponent,
            ],
            imports: [
                TableModule
            ]
        }).compileComponents();
    }));
    it('should create the app', async(() => {
        const fixture = TestBed.createComponent(AppTableComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    }));
    it(`should have as title 'Sample Test'`, async(() => {
        const fixture = TestBed.createComponent(AppTableComponent);
        const app : AppTableComponent = fixture.debugElement.componentInstance;
        app.title = 'Sample Test';
        app.value = [
            {
                id: '1',
                name: "ABCD"
            }
        ]
        fixture.detectChanges();
        const div = fixture.nativeElement.querySelector('div.app-table-body');

        expect(div.innerHTML).toContain('Sample Test');



    }));
});
