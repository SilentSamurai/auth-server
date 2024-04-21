import {NgModule} from '@angular/core';
import {TableModule} from "primeng/table";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {MultiSelectModule} from "primeng/multiselect";
import {ChipModule} from "primeng/chip";
import {NavBarModule} from "../nav-bar/nav-bar.module";
import {MenuModule} from "primeng/menu";
import {TenantDetailsComponent} from "./tenant-details.component";
import {AddMemberComponent} from "./add-member/add-member.component";
import {AddScopeComponent} from "./add-scope/add-scope.component";
import {AssignScopeComponent} from "./assign-scope/assign-scope.component";
import {RemoveMemberComponent} from "./remove-member/remove-member.component";
import {RemoveScopeComponent} from "./remove-scope/remove-scope.component";
import {TenantModule} from "../board-tenants/tenant.module";
import {PanelMenuModule} from "primeng/panelmenu";

@NgModule({
    declarations: [
        TenantDetailsComponent,
        AddMemberComponent,
        AddScopeComponent,
        AssignScopeComponent,
        RemoveMemberComponent,
        RemoveScopeComponent
    ],
    imports: [
        TableModule,
        RouterModule,
        CommonModule,
        FormsModule,
        MultiSelectModule,
        ChipModule,
        NavBarModule,
        MenuModule,
        TenantModule,
        PanelMenuModule
    ],
    providers: [],
})
export class TenantDetailsModule {
}
