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

import {authInterceptorProviders} from './_helpers/auth.interceptor';
import {NgbDropdown, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TableModule} from 'primeng/table';
import {TenantModule} from "./board-tenants/tenant.module";
import {UserModule} from "./board-user/user.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        HomeComponent,
        ProfileComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
        TableModule,
        TenantModule,
        UserModule,
        BrowserAnimationsModule
    ],
    providers: [authInterceptorProviders, NgbDropdown],
    bootstrap: [AppComponent]
})
export class AppModule {
}
