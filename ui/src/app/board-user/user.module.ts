import {NgModule} from '@angular/core';
import {UserDetailsComponent} from "./user-details/user-details.component";
import {BoardUserComponent} from "./board-user.component";
import {CreateUserModalComponent} from "./create-user-modal/create-user-modal.component";
import {EditUserModalComponent} from "./edit-user-modal/edit-user-modal.component";
import {TableModule} from "primeng/table";
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {NavBarModule} from "../nav-bar/nav-bar.module";
import {CardModule} from "primeng/card";
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {ButtonModule} from "primeng/button";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ToastModule} from "primeng/toast";

@NgModule({
    declarations: [
        UserDetailsComponent,
        BoardUserComponent,
        CreateUserModalComponent,
        EditUserModalComponent
    ],
    imports: [
        FormsModule,
        TableModule,
        RouterModule,
        CommonModule,
        NavBarModule,
        CardModule,
        DialogModule,
        InputTextModule,
        ButtonModule,
        ConfirmPopupModule,
        ToastModule
    ],
    providers: [],
})
export class UserModule {
}
