import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
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
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {ApiDocsComponent} from "./api-docs/api-docs.component";
import {NavBarModule} from "./nav-bar/nav-bar.module";
import {RouterModule} from "@angular/router";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        HomeComponent,
        ProfileComponent,
        ApiDocsComponent
    ],
    imports: [
        BrowserModule,
        RouterModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
        TableModule,
        TenantModule,
        UserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        ToastModule,
        NavBarModule
    ],
    providers: [authInterceptorProviders, NgbDropdown, MessageService],
    exports: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
