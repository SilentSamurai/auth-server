import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {RegisterComponent} from './register/register.component';
import {LoginComponent} from './login/login.component';
import {UserListComponent} from './secure/users/user-list.component';
import {TN01Component} from './secure/tenants/TN01.component';
import {UserDetailsComponent} from "./secure/users/user-details.component";
import {SessionConfirmationComponent} from "./session/session-confirmation.component";
import {TN02Component} from "./secure/tenants/TN02.component";
import {HomeComponent} from './secure/home.component';
import {AdminAuthGuard} from "./shared/admin-auth-guard.service";
import {RoleListComponent} from "./secure/roles/role-list.component";
import {RoleSelectionComponent} from "./secure/roles/role-selection.component";
import {GroupListComponent} from "./secure/group/group-list.component";
import {GroupSelectionComponent} from "./secure/group/group-selection.component";
import {GroupObjectComponent} from "./secure/group/group-object.component";
import {RoleObjectComponent} from "./secure/roles/role-object.component";
import {TN02SelectionComponent} from "./secure/tenants/TN02-selection.component";
import {TNRL01Component} from "./secure/tenants/TNRL01.component";
import {TNRL01SelectionComponent} from "./secure/tenants/TNRL01-selection.component";

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
            // tenants
            {path: 'TN01', component: TN01Component, canActivate: []},
            {path: 'TN02', component: TN02SelectionComponent, canActivate: []},
            {path: 'TN02/:tenantId', component: TN02Component, canActivate: []},
            {path: 'TNRL01', component: TNRL01SelectionComponent, canActivate: []},
            {path: 'TNRL01/:tenantId/:email', component: TNRL01Component, canActivate: []},

            // roles
            {path: 'RL03', component: RoleObjectComponent, canActivate: []},
            {path: 'RL02', component: RoleSelectionComponent, canActivate: []},
            {path: 'RL02/:tenantId/:email', component: RoleListComponent, canActivate: []},
            // groups
            {path: 'GP01', component: GroupListComponent, canActivate: []},
            {path: 'GP02', component: GroupSelectionComponent, canActivate: []},
            {path: 'GP02/:groupId', component: GroupObjectComponent, canActivate: []},
            // users
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
