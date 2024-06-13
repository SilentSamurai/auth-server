import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {TableModule} from "primeng/table";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {MultiSelectModule} from "primeng/multiselect";
import {ChipModule} from "primeng/chip";
import {MenuModule} from "primeng/menu";
import {PanelMenuModule} from "primeng/panelmenu";
import {HomeComponent} from './home.component';
import {AdminNavBarComponent} from "./nav-bar.component";
import {NgbCollapseModule, NgbDropdownModule, NgbNavModule} from "@ng-bootstrap/ng-bootstrap";
import {TenantListComponent} from "./tenants/tenant-list.component";
import {UpdateTenantComponent} from "./tenants/update-tenant.component";
import {DeleteTenantComponent} from "./tenants/delete-tenant.component";
import {CreateTenantComponent} from "./tenants/create-tenant.component";
import {UserDetailsComponent} from "./users/user-details.component";
import {UserListComponent} from "./users/user-list.component";
import {CreateUserModalComponent} from "./users/create-user.modal.component";
import {EditUserModalComponent} from "./users/edit-user.modal.component";
import {DeleteUserModalComponent} from "./users/delete-user.modal.component";
import {ViewTenantComponent} from "./tenants/view-tenant/view-tenant.component";
import {AddMemberComponent} from "./tenants/view-tenant/add-member.component";
import {AddRoleComponent} from "./tenants/view-tenant/add-role.component";
import {RemoveMemberComponent} from "./tenants/view-tenant/remove-member.component";
import {RemoveRoleComponent} from "./tenants/view-tenant/remove-role.component";
import {ComponentModule} from "../component/component.module";
import {RoleListComponent} from "./roles/role-list.component";
import {RoleSelectionComponent} from "./roles/role-selection.component";
import {InputTextModule} from "primeng/inputtext";
import {MessagesModule} from "primeng/messages";
import {GroupSelectionComponent} from "./group/group-selection.component";
import {GroupListComponent} from "./group/group-list.component";
import {CreateGroupComponent} from "./group/create-group.component";
import {GroupObjectComponent} from "./group/group-object.component";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {ConfirmationService, MessageService} from "primeng/api";
import {UpdateGroupComponent} from "./group/update-group.component";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        HomeComponent,
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
        AddRoleComponent,
        RemoveMemberComponent,
        RemoveRoleComponent,
        RoleListComponent,
        RoleSelectionComponent,
        GroupSelectionComponent,
        GroupListComponent,
        CreateGroupComponent,
        GroupObjectComponent,
        UpdateGroupComponent
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
        MessagesModule,
        ConfirmDialogModule
    ],
    providers: [ConfirmationService, MessageService],
    exports: [
        AdminNavBarComponent
    ]
})
export class SecureModule {
}
