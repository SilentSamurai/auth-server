import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {MessageService} from "primeng/api";
import {NavBarComponent} from "./nav-bar.component";
import {RouterModule} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {AppRoutingModule} from "../app-routing.module";
import {HttpClientModule} from "@angular/common/http";
import {MenubarModule} from "primeng/menubar";
import {MenuModule} from "primeng/menu";
import {ButtonModule} from "primeng/button";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        NavBarComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        TableModule,
        RouterModule,
        MenubarModule,
        MenuModule,
        ButtonModule
    ],
    providers: [MessageService],
    exports: [
        NavBarComponent
    ],
})
export class NavBarModule {
}
