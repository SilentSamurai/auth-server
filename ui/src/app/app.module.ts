import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {HomeComponent} from './home/home.component';
import {ProfileComponent} from './profile/profile.component';
import {BoardAdminComponent} from './board-admin/board-admin.component';
import {BoardUserComponent} from './board-user/board-user.component';

import {authInterceptorProviders} from './_helpers/auth.interceptor';
import {NgbDropdown, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TableModule} from 'primeng/table';
import {CreateUserModalComponent} from "./board-user/create-user-modal/create-user-modal.component";
import {EditUserModalComponent} from "./board-user/edit-user-modal/edit-user-modal.component";
import {DeleteUserModalComponent} from "./board-user/delete-user-modal/delete-user-modal.component";
import {TenantModule} from "./board-tenants/tenant.module";

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        HomeComponent,
        ProfileComponent,
        BoardAdminComponent,
        BoardUserComponent,
        CreateUserModalComponent,
        EditUserModalComponent,
        DeleteUserModalComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
        TableModule,
        TenantModule,
    ],
    providers: [authInterceptorProviders, NgbDropdown],
    bootstrap: [AppComponent]
})
export class AppModule {
}
