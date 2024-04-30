import {NgModule} from '@angular/core';
import {TableModule} from "primeng/table";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {MultiSelectModule} from "primeng/multiselect";
import {ChipModule} from "primeng/chip";
import {NavBarModule} from "../nav-bar/nav-bar.module";
import {MenuModule} from "primeng/menu";
import {TenantModule} from "../board-tenants/tenant.module";
import {PanelMenuModule} from "primeng/panelmenu";
import { AdminHomeComponent } from './home/admin-home.component';

@NgModule({
    declarations: [
        AdminHomeComponent
    ],
    imports: [
        TableModule,
        RouterModule,
        CommonModule,
        FormsModule,
        MultiSelectModule,
        ChipModule,
        NavBarModule,
        MenuModule,
        TenantModule,
        PanelMenuModule
    ],
    providers: [],
})
export class AdminModule {
}
