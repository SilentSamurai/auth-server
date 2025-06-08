import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './open-pages/login/login.component';
import {RegisterComponent} from './open-pages/register/register.component';
import {ProfileComponent} from './open-pages/profile/profile.component';
import {ForgotPasswordComponent} from './open-pages/forgot-password/forgot-password.component';
import {ResetPasswordComponent} from './open-pages/reset-password/reset-password.component';
import {CenteredCardComponent} from './component/centered-card/centered-card.component';

import {authInterceptorProviders} from './_helpers/auth.interceptor';
import {NgbCollapseModule, NgbDropdown, NgbModule,} from '@ng-bootstrap/ng-bootstrap';
import {TableModule} from 'primeng/table';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ToastModule} from 'primeng/toast';
import {ConfirmationService, MessageService} from 'primeng/api';
import {RouterModule} from '@angular/router';
import {SessionConfirmationComponent} from './open-pages/session/session-confirmation.component';
import {SecureModule} from './secure/secure.module';
import {CardModule} from 'primeng/card';
import {ComponentModule} from './component/component.module';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {HttpErrorComponent} from './error-pages/HttpError.component';
import {AbilityModule} from '@casl/angular';
import {Ability, createMongoAbility, PureAbility,} from '@casl/ability';
import {AuthorizeLoginComponent} from "./open-pages/authorize/authorize-login.component";
import {NgOptimizedImage} from "@angular/common";
import {TenantSelectionComponent} from './open-pages/tenant-selection/tenant-selection.component';

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        ProfileComponent,
        SessionConfirmationComponent,
        HttpErrorComponent,
        AuthorizeLoginComponent,
        TenantSelectionComponent,
        ForgotPasswordComponent,
        ResetPasswordComponent,
        CenteredCardComponent
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
        SecureModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        ToastModule,
        CardModule,
        ComponentModule,
        ConfirmDialogModule,
        AbilityModule,
        NgOptimizedImage,
    ],
    providers: [
        authInterceptorProviders,
        NgbDropdown,
        MessageService,
        ConfirmationService,
        {provide: PureAbility, useValue: createMongoAbility()},
        {provide: Ability, useExisting: PureAbility},
    ],
    exports: [],
    bootstrap: [AppComponent],
})
export class AppModule {
}
