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
import {AddMemberComponent} from "./add-member/add-member.component";
import {AddRoleComponent} from "./add-role/add-role.component";
import {AssignRoleComponent} from "./assign-role/assign-role.component";
import {MultiSelectModule} from "primeng/multiselect";
import {RemoveMemberComponent} from "./remove-member/remove-member.component";

@NgModule({
    declarations: [
        BoardTenantComponent,
        TenantDetailsComponent,
        CreateTenantComponent,
        UpdateTenantComponent,
        DeleteTenantComponent,
        AddMemberComponent,
        AddRoleComponent,
        AssignRoleComponent,
        RemoveMemberComponent
    ],
    imports: [
        TableModule,
        RouterModule,
        CommonModule,
        FormsModule,
        MultiSelectModule,
    ],
    providers: [],
})
export class TenantModule {
}
