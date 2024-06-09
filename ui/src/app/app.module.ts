import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {ProfileComponent} from './profile/profile.component';

import {authInterceptorProviders} from './_helpers/auth.interceptor';
import {NgbCollapseModule, NgbDropdown, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TableModule} from 'primeng/table';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {RouterModule} from "@angular/router";
import {SessionConfirmationComponent} from "./session/session-confirmation.component";
import {AdminModule} from "./secure/admin.module";
import {CardModule} from "primeng/card";
import {ComponentModule} from "./component/component.module";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        ProfileComponent,
        SessionConfirmationComponent
    ],
    imports: [
        BrowserModule,
        RouterModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
        NgbCollapseModule,
        TableModule,
        AdminModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        ToastModule,
        CardModule,
        ComponentModule
    ],
    providers: [authInterceptorProviders, NgbDropdown, MessageService],
    exports: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
