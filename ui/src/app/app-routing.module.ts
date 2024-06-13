import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {RegisterComponent} from './register/register.component';
import {LoginComponent} from './login/login.component';
import {UserListComponent} from './secure/users/user-list.component';
import {TenantListComponent} from './secure/tenants/tenant-list.component';
import {UserDetailsComponent} from "./secure/users/user-details.component";
import {SessionConfirmationComponent} from "./session/session-confirmation.component";
import {ViewTenantComponent} from "./secure/tenants/view-tenant/view-tenant.component";
import {HomeComponent} from './secure/home.component';
import {AdminAuthGuard} from "./shared/admin-auth-guard.service";
import {RoleListComponent} from "./secure/roles/role-list.component";
import {RoleSelectionComponent} from "./secure/roles/role-selection.component";
import {GroupListComponent} from "./secure/group/group-list.component";
import {GroupSelectionComponent} from "./secure/group/group-selection.component";
import {GroupObjectComponent} from "./secure/group/group-object.component";

const routes: Routes = [
    {path: 'session-confirm', component: SessionConfirmationComponent},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {
        path: '',
        canActivate: [AdminAuthGuard],
        children: [
            {path: 'home', component: HomeComponent, canActivate: []},
            {path: 'users', component: UserListComponent, canActivate: []},
            {path: 'tenants', component: TenantListComponent, canActivate: []},
            {path: 'RL02', component: RoleSelectionComponent, canActivate: []},
            {path: 'RL02/:tenantId/:email', component: RoleListComponent, canActivate: []},
            {path: 'GP01', component: GroupListComponent, canActivate: []},
            {path: 'GP02', component: GroupSelectionComponent, canActivate: []},
            {path: 'GP02/:groupId', component: GroupObjectComponent, canActivate: []},
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
