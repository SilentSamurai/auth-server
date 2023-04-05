import {NgModule} from '@angular/core';
import {BoardTenantComponent} from "./board-tenant.component";
import {TableModule} from "primeng/table";
import {ShowTenantComponent} from "./show-tenant/show-tenant.component";
import {RouterModule} from "@angular/router";

@NgModule({
    declarations: [
        BoardTenantComponent,
        ShowTenantComponent
    ],
    imports: [
        TableModule,
        RouterModule,
    ],
    providers: [],
})
export class TenantModule {
}
