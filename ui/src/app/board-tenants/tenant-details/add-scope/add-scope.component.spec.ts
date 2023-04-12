import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AddScopeComponent} from './add-scope.component';

describe('CreateTenantComponent', () => {
    let component: AddScopeComponent;
    let fixture: ComponentFixture<AddScopeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddScopeComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddScopeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
