import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {TableModule} from "primeng/table";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {MultiSelectModule} from "primeng/multiselect";
import {ChipModule} from "primeng/chip";
import {MenuModule} from "primeng/menu";
import {TenantDetailsComponent} from "./tenant/tenant-details.component";
import {AddMemberComponent} from "./tenant/add-member/add-member.component";
import {AddScopeComponent} from "./tenant/add-scope/add-scope.component";
import {AssignScopeComponent} from "./tenant/assign-scope/assign-scope.component";
import {RemoveMemberComponent} from "./tenant/remove-member/remove-member.component";
import {RemoveScopeComponent} from "./tenant/remove-scope/remove-scope.component";
import {PanelMenuModule} from "primeng/panelmenu";
import {UpdateTenantComponent} from "./tenant/update-tenant/update-tenant.component";
import {NavBarComponent} from "./nav-bar/nav-bar.component";
import {NgbCollapseModule, NgbDropdownModule, NgbNavModule} from "@ng-bootstrap/ng-bootstrap";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        TenantDetailsComponent,
        AddMemberComponent,
        AddScopeComponent,
        AssignScopeComponent,
        RemoveMemberComponent,
        RemoveScopeComponent,
        UpdateTenantComponent,
        NavBarComponent
    ],
    imports: [
        TableModule,
        RouterModule,
        CommonModule,
        FormsModule,
        MultiSelectModule,
        ChipModule,
        MenuModule,
        PanelMenuModule,
        NgbNavModule,
        NgbCollapseModule,
        NgbDropdownModule
    ],
    providers: [],
    exports: [
        NavBarComponent
    ]
})
export class NonAdminModule {
}
