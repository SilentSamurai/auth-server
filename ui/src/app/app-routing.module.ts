import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {RegisterComponent} from './register/register.component';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './home/home.component';
import {ProfileComponent} from './profile/profile.component';
import {BoardUserComponent} from './board-user/board-user.component';
import {BoardTenantComponent} from './board-tenants/board-tenant.component';
import {UserAuthGuard} from "./shared/user-auth-guard.service";
import {TenantDetailsComponent} from "./board-tenants/tenant-details/tenant-details.component";
import {UserDetailsComponent} from "./board-user/user-details/user-details.component";
import {OtpDisplayComponent} from "./opt-page/otp-display.component";

const routes: Routes = [
    {path: 'home', component: HomeComponent, canActivate: []},
    {path: 'opt-page', component: OtpDisplayComponent, canActivate: []},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'profile', component: ProfileComponent, canActivate: [UserAuthGuard]},
    {path: 'users', component: BoardUserComponent, canActivate: [UserAuthGuard]},
    {path: 'tenants', component: BoardTenantComponent, canActivate: [UserAuthGuard]},
    {path: 'tenant/:tenantId', component: TenantDetailsComponent, canActivate: [UserAuthGuard]},
    {path: 'user/:email', component: UserDetailsComponent, canActivate: [UserAuthGuard]},
    {path: '', redirectTo: 'home', pathMatch: 'full'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
