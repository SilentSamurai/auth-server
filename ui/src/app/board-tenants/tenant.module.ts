import {NgModule} from '@angular/core';
import {BoardTenantComponent} from "./board-tenant.component";
import {TableModule} from "primeng/table";
import {TenantDetailsComponent} from "./tenant-details/tenant-details.component";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {CreateTenantComponent} from './create-tenant/create-tenant.component';
import {FormsModule} from "@angular/forms";
import {UpdateTenantComponent} from "./update-tenant/update-tenant.component";
import {AddMemberComponent} from "./tenant-details/add-member/add-member.component";
import {AddScopeComponent} from "./tenant-details/add-scope/add-scope.component";
import {AssignScopeComponent} from "./tenant-details/assign-scope/assign-scope.component";
import {MultiSelectModule} from "primeng/multiselect";
import {ChipModule} from "primeng/chip";
import {NavBarModule} from "../nav-bar/nav-bar.module";
import {ButtonModule} from "primeng/button";
import {CardModule} from "primeng/card";
import {DynamicDialogModule} from "primeng/dynamicdialog";
import {InputTextModule} from "primeng/inputtext";
import {ConfirmPopupModule} from "primeng/confirmpopup";

@NgModule({
    declarations: [
        BoardTenantComponent,
        TenantDetailsComponent,
        CreateTenantComponent,
        UpdateTenantComponent,
        AddMemberComponent,
        AddScopeComponent,
        AssignScopeComponent
    ],
    imports: [
        TableModule,
        RouterModule,
        CommonModule,
        FormsModule,
        MultiSelectModule,
        ChipModule,
        NavBarModule,
        ButtonModule,
        CardModule,
        DynamicDialogModule,
        InputTextModule,
        ConfirmPopupModule
    ],
    providers: [],
})
export class TenantModule {
}
