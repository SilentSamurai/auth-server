import {NgModule} from '@angular/core';
import {BoardTenantComponent} from "./board-tenant.component";
import {TableModule} from "primeng/table";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {CreateTenantComponent} from './create-tenant/create-tenant.component';
import {FormsModule} from "@angular/forms";
import {UpdateTenantComponent} from "./update-tenant/update-tenant.component";
import {DeleteTenantComponent} from "./delete-tenant/delete-tenant.component";
import {MultiSelectModule} from "primeng/multiselect";
import {ChipModule} from "primeng/chip";
import {NavBarModule} from "../nav-bar/nav-bar.module";
import {MenuModule} from "primeng/menu";

@NgModule({
    declarations: [
        BoardTenantComponent,
        CreateTenantComponent,
        UpdateTenantComponent,
        DeleteTenantComponent,
    ],
    imports: [
        TableModule,
        RouterModule,
        CommonModule,
        FormsModule,
        MultiSelectModule,
        ChipModule,
        NavBarModule,
        MenuModule
    ],
    providers: [],
})
export class TenantModule {
}
