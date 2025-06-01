import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {RegisterComponent} from './open-pages/register/register.component';
import {LoginComponent} from './open-pages/login/login.component';
import {UR01Component} from './secure/users/UR01.component';
import {TN01Component} from './secure/tenants/TN01.component';
import {UR02Component} from './secure/users/UR02.component';
import {SessionConfirmationComponent} from './open-pages/session/session-confirmation.component';
import {TN02Component} from './secure/tenants/TN02.component';
import {HomeComponent} from './secure/home.component';
import {SuperAdminAuthGuard} from './shared/super-admin-auth-guard.service';
import {RL01Component} from './secure/roles/RL01.component';
import {RL02SelectionComponent} from './secure/roles/RL02-selection.component';
import {GP01Component} from './secure/group/GP01.component';
import {GP02SelectionComponent} from './secure/group/GP02-selection.component';
import {GP02Component} from './secure/group/GP02.component';
import {RL02Component} from './secure/roles/RL02.component';
import {TN02SelectionComponent} from './secure/tenants/TN02-selection.component';
import {TNRL01Component} from './secure/tenants/TNRL01.component';
import {TNRL01SelectionComponent} from './secure/tenants/TNRL01-selection.component';
import {UR02SelectionComponent} from './secure/users/UR02-selection.component';
import {UserAuthGuard} from './shared/user-auth-guard.service';
import {HttpErrorComponent} from './error-pages/HttpError.component';
import {TenantAccessAuthGuard} from './shared/tenant-auth-guard.service';
import {AP01Component} from './secure/apps/AP01.component';
import {AuthorizeLoginComponent} from "./open-pages/authorize/authorize-login.component";
import {TenantSelectionComponent} from './open-pages/tenant-selection/tenant-selection.component';

const routes: Routes = [
    {path: 'session-confirm', component: SessionConfirmationComponent},
    {path: 'authorize', component: AuthorizeLoginComponent},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'error/:msg', component: HttpErrorComponent},
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {
        path: '',
        canActivate: [UserAuthGuard],
        children: [
            {path: 'home', component: HomeComponent, canActivate: []},

            {
                path: 'TN02/:tenantId',
                component: TN02Component,
                canActivate: [TenantAccessAuthGuard],
            },
            {
                path: 'TNRL01/:tenantId/:userId',
                component: TNRL01Component,
                canActivate: [TenantAccessAuthGuard],
            },
            {
                path: 'RL02/:tenantId/:roleId',
                component: RL02Component,
                canActivate: [TenantAccessAuthGuard],
            },
        ],
    },
    {
        path: '',
        canActivate: [SuperAdminAuthGuard],
        children: [
            // tenants
            {path: 'TN01', component: TN01Component, canActivate: []},
            {
                path: 'TN02',
                component: TN02SelectionComponent,
                canActivate: [],
            },

            {
                path: 'TNRL01',
                component: TNRL01SelectionComponent,
                canActivate: [],
            },

            // casl
            {path: 'RL01', component: RL01Component, canActivate: []},
            {
                path: 'RL02',
                component: RL02SelectionComponent,
                canActivate: [],
            },

            // groups
            {path: 'GP01', component: GP01Component, canActivate: []},
            {
                path: 'GP02',
                component: GP02SelectionComponent,
                canActivate: [],
            },
            {
                path: 'GP02/:groupId',
                component: GP02Component,
                canActivate: [],
            },

            // users
            {path: 'UR01', component: UR01Component, canActivate: []},
            {
                path: 'UR02',
                component: UR02SelectionComponent,
                canActivate: [],
            },
            {path: 'UR02/:userId', component: UR02Component, canActivate: []},

            // apps
            {path: 'AP01', component: AP01Component, canActivate: []},
        ],
    },
    {path: 'tenant-selection', component: TenantSelectionComponent},
    {path: '**', redirectTo: '/error/404'},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {
}
