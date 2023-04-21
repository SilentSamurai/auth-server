import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ApiDocs} from './nav-bar.component';

describe('HomeComponent', () => {
    let component: ApiDocs;
    let fixture: ComponentFixture<ApiDocs>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ApiDocs]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ApiDocs);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
