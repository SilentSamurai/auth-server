import {NgModule} from '@angular/core';
import {UserDetailsComponent} from "./user-details/user-details.component";
import {BoardUserComponent} from "./board-user.component";
import {CreateUserModalComponent} from "./create-user-modal/create-user-modal.component";
import {EditUserModalComponent} from "./edit-user-modal/edit-user-modal.component";
import {DeleteUserModalComponent} from "./delete-user-modal/delete-user-modal.component";
import {TableModule} from "primeng/table";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";

@NgModule({
    declarations: [
        UserDetailsComponent,
        BoardUserComponent,
        CreateUserModalComponent,
        EditUserModalComponent,
        DeleteUserModalComponent
    ],
    imports: [
        FormsModule,
        NgbModule,
        TableModule,
        RouterModule,
        CommonModule,
    ],
    providers: [],
})
export class UserModule {
}
