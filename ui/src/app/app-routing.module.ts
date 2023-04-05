import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {RegisterComponent} from './register/register.component';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './home/home.component';
import {ProfileComponent} from './profile/profile.component';
import {BoardUserComponent} from './board-user/board-user.component';
import {BoardModeratorComponent} from './board-moderator/board-moderator.component';
import {BoardAdminComponent} from './board-admin/board-admin.component';
import {UserAuthGuard} from "./shared/user-auth-guard.service";

const routes: Routes = [
    {path: 'home', component: HomeComponent, canActivate: [UserAuthGuard]},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'profile', component: ProfileComponent, canActivate: [UserAuthGuard]},
    {path: 'users', component: BoardUserComponent, canActivate: [UserAuthGuard]},
    {path: 'mod', component: BoardModeratorComponent, canActivate: [UserAuthGuard]},
    {path: 'admin', component: BoardAdminComponent, canActivate: [UserAuthGuard]},
    {path: '', redirectTo: 'login', pathMatch: 'full'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
