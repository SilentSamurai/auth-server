import {NgModule} from '@angular/core';
import {BoardTenantComponent} from "./board-tenant.component";
import {TableModule} from "primeng/table";
import {TenantDetailsComponent} from "./tenant-details/tenant-details.component";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {CreateTenantComponent} from './create-tenant/create-tenant.component';
import {FormsModule} from "@angular/forms";
import {UpdateTenantComponent} from "./update-tenant/update-tenant.component";
import {DeleteTenantComponent} from "./delete-tenant/delete-tenant.component";
import {AddMemberComponent} from "./tenant-details/add-member/add-member.component";
import {AddScopeComponent} from "./tenant-details/add-scope/add-scope.component";
import {AssignScopeComponent} from "./tenant-details/assign-scope/assign-scope.component";
import {MultiSelectModule} from "primeng/multiselect";
import {RemoveMemberComponent} from "./tenant-details/remove-member/remove-member.component";
import {ChipModule} from "primeng/chip";
import {RemoveScopeComponent} from "./tenant-details/remove-scope/remove-scope.component";

@NgModule({
    declarations: [
        BoardTenantComponent,
        TenantDetailsComponent,
        CreateTenantComponent,
        UpdateTenantComponent,
        DeleteTenantComponent,
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
    ],
    providers: [],
})
export class TenantModule {
}
