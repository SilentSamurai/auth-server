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
import {ValueHelpComponent} from "./value-help/value-help.component";
import {ValueHelpInputComponent} from "./value-help-input/value-help-input.component";
import {SkeletonModule} from "primeng/skeleton";
import {ValueHelpColumnComponent} from "./value-help-input/value-help-column.component";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        TileComponent,
        ValueHelpComponent,
        ValueHelpInputComponent,
        ValueHelpColumnComponent
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
        CardModule,
        SkeletonModule
    ],
    providers: [],
    exports: [
        TileComponent,
        ValueHelpInputComponent,
        ValueHelpColumnComponent
    ]
})
export class ComponentModule {
}
