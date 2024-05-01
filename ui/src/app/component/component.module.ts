import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {TableModule} from "primeng/table";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {MultiSelectModule} from "primeng/multiselect";
import {ChipModule} from "primeng/chip";
import {MenuModule} from "primeng/menu";
import {PanelMenuModule} from "primeng/panelmenu";
import {NgbCollapseModule, NgbDropdownModule, NgbNavModule} from "@ng-bootstrap/ng-bootstrap";
import {TileComponent} from "./tile/tile.component";
import {CardModule} from "primeng/card";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        TileComponent
    ],
    imports: [
        TableModule,
        RouterModule,
        CommonModule,
        FormsModule,
        MultiSelectModule,
        ChipModule,
        MenuModule,
        PanelMenuModule,
        NgbNavModule,
        NgbCollapseModule,
        NgbDropdownModule,
        CardModule
    ],
    providers: [],
    exports: [
        TileComponent
    ]
})
export class ComponentModule {
}
