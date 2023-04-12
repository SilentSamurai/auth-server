import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BoardTenantComponent} from './board-tenant.component';

describe('BoardModeratorComponent', () => {
    let component: BoardTenantComponent;
    let fixture: ComponentFixture<BoardTenantComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BoardTenantComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BoardTenantComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
