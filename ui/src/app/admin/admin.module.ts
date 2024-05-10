import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {TableModule} from "primeng/table";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {MultiSelectModule} from "primeng/multiselect";
import {ChipModule} from "primeng/chip";
import {MenuModule} from "primeng/menu";
import {PanelMenuModule} from "primeng/panelmenu";
import {AdminHomeComponent} from './home/admin-home.component';
import {AdminNavBarComponent} from "./nav-bar/nav-bar.component";
import {NgbCollapseModule, NgbDropdownModule, NgbNavModule} from "@ng-bootstrap/ng-bootstrap";
import {TenantListComponent} from "./tenants/tenant-list.component";
import {UpdateTenantComponent} from "./tenants/update-tenant/update-tenant.component";
import {DeleteTenantComponent} from "./tenants/delete-tenant/delete-tenant.component";
import {CreateTenantComponent} from "./tenants/create-tenant/create-tenant.component";
import {UserDetailsComponent} from "./users/user-details/user-details.component";
import {UserListComponent} from "./users/user-list.component";
import {CreateUserModalComponent} from "./users/create-user-modal/create-user-modal.component";
import {EditUserModalComponent} from "./users/edit-user-modal/edit-user-modal.component";
import {DeleteUserModalComponent} from "./users/delete-user-modal/delete-user-modal.component";
import {ViewTenantComponent} from "./tenants/view-tenant/view-tenant.component";
import {AddMemberComponent} from "./tenants/view-tenant/add-member/add-member.component";
import {AddScopeComponent} from "./tenants/view-tenant/add-scope/add-scope.component";
import {AssignScopeComponent} from "./tenants/view-tenant/assign-scope/assign-scope.component";
import {RemoveMemberComponent} from "./tenants/view-tenant/remove-member/remove-member.component";
import {RemoveScopeComponent} from "./tenants/view-tenant/remove-scope/remove-scope.component";
import {ComponentModule} from "../component/component.module";
import {RoleListComponent} from "./roles/role-list.component";
import {RoleSelectionComponent} from "./roles/role-selection.component";
import {InputTextModule} from "primeng/inputtext";
import {MessagesModule} from "primeng/messages";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        AdminHomeComponent,
        AdminNavBarComponent,
        TenantListComponent,
        UpdateTenantComponent,
        DeleteTenantComponent,
        CreateTenantComponent,
        UserDetailsComponent,
        UserListComponent,
        CreateUserModalComponent,
        EditUserModalComponent,
        DeleteUserModalComponent,
        ViewTenantComponent,
        AddMemberComponent,
        AddScopeComponent,
        AssignScopeComponent,
        RemoveMemberComponent,
        RemoveScopeComponent,
        RoleListComponent,
        RoleSelectionComponent
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
        NgbCollapseModule,
        NgbNavModule,
        NgbDropdownModule,
        ComponentModule,
        InputTextModule,
        MessagesModule
    ],
    providers: [],
    exports: [
        AdminNavBarComponent
    ]
})
export class AdminModule {
}
