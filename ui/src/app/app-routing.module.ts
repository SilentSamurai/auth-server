import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {RegisterComponent} from './register/register.component';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './non-admin/home/home.component';
import {UserListComponent} from './admin/users/user-list.component';
import {TenantListComponent} from './admin/tenants/tenant-list.component';
import {UserAuthGuard} from "./shared/user-auth-guard.service";
import {UserDetailsComponent} from "./admin/users/user-details/user-details.component";
import {SessionConfirmationComponent} from "./session/session-confirmation.component";
import {ViewTenantComponent} from "./admin/tenants/view-tenant/view-tenant.component";
import {AdminHomeComponent} from './admin/home/admin-home.component';
import {AdminAuthGuard} from "./shared/admin-auth-guard.service";
import {TenantDetailsComponent} from "./non-admin/tenant/tenant-details.component";
import {RoleListComponent} from "./admin/roles/role-list.component";
import {RoleSelectionComponent} from "./admin/roles/role-selection.component";

const routes: Routes = [
    {path: 'session-confirm', component: SessionConfirmationComponent},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {
        path: "",
        canActivate: [UserAuthGuard],
        children: [
            {path: 'home', component: HomeComponent, canActivate: []},
            {path: 'tenant/:tenantId', component: TenantDetailsComponent, canActivate: []},
        ]
    },
    {
        path: 'admin',
        canActivate: [AdminAuthGuard],
        children: [
            {path: '', component: AdminHomeComponent, canActivate: []},
            {path: 'users', component: UserListComponent, canActivate: []},
            {path: 'tenants', component: TenantListComponent, canActivate: []},
            {path: 'RL02-SEL', component: RoleSelectionComponent, canActivate: []},
            {path: 'RL02/:tenantId/:email', component: RoleListComponent, canActivate: []},
            {path: 'tenant/:tenantId', component: ViewTenantComponent, canActivate: []},
            {path: 'user/:email', component: UserDetailsComponent, canActivate: []},
        ]
    },
    {path: '', redirectTo: 'home', pathMatch: 'full'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
