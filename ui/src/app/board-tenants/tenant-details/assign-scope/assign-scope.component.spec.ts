import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AssignScopeComponent} from './assign-scope.component';

describe('CreateTenantComponent', () => {
    let component: AssignScopeComponent;
    let fixture: ComponentFixture<AssignScopeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AssignScopeComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignScopeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
