import { Component, OnInit, Input } from '@angular/core';
import { StaticModel } from "../../component/model/StaticModel";
import { RoleService } from "../../_services/role.service";
import { MessageService } from "primeng/api";
import { TenantService } from "../../_services/tenant.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-add-users-modal',
  template: `
      <app-standard-dialog
          [title]="'Add Users to Role'"
          [subtitle]="roleName"
      >
          <app-dialog-tab name="Users">
              <app-value-help-input
                  [dataModel]="usersDM"
                  [(selection)]="selectedUsers"
                  labelField="name"
                  multi="true"
                  name="Users"
                  label="Select Users"
                  placeholder="Select Users"
              >
                  <app-vh-col label="Email" name="email"></app-vh-col>
                  <ng-template #vh_body let-row>
                      <td>{{ row.email }}</td>
                  </ng-template>
              </app-value-help-input>
          </app-dialog-tab>

          <app-dialog-footer>
              <button type="button" class="btn btn-secondary" (click)="onClose()">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="onSave()">Add Users</button>
          </app-dialog-footer>
      </app-standard-dialog>
  `
})
export class AddUsersModalComponent implements OnInit {
  @Input() tenantId!: string;
  @Input() roleName!: string;

  selectedUsers: any[] = [];
  usersDM = new StaticModel(['id']);

  constructor(
    private roleService: RoleService,
    private tenantService: TenantService,
    private messageService: MessageService,
    public activeModal: NgbActiveModal
  ) {}

  public async ngOnInit(): Promise<void> {
    try {
      const tenantUsers = await this.tenantService.getMembers(this.tenantId);
      this.usersDM.setData(tenantUsers);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error loading tenant users',
        detail: error.message
      });
      this.activeModal.dismiss();
    }
  }

  public onClose() {
    this.activeModal.dismiss();
  }

  public async onSave() {
    try {
      await this.roleService.addUser(
        this.tenantId,
        this.roleName,
        this.selectedUsers.map(u => u.email)
      );
      this.activeModal.close(true);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Assignment Failed',
        detail: error.message
      });
      this.activeModal.dismiss();
    }
  }
}
