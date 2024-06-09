import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";
import {TokenStorageService} from "../../../_services/token-storage.service";
import {UpdateTenantComponent} from "../update-tenant.component";
import {AddMemberComponent} from "./add-member.component";
import {AddRoleComponent} from "./add-role.component";
import {RemoveRoleComponent} from "./remove-role.component";
import {RemoveMemberComponent} from "./remove-member.component";

@Component({
    selector: 'view-tenant',
    templateUrl: './view-tenant.component.html',
    styles: ['']
})
export class ViewTenantComponent implements OnInit {

    selectedMenu = "OVR";
    menu = [
        {
            id: "OVR",
            label: 'Overview',
            icon: 'pi pi-fw pi-sitemap',
            command: () => {
                this.selectedMenu = "OVR";
            }
        },
        {
            id: "MEM",
            label: 'Members',
            icon: 'pi pi-fw pi-users',
            command: () => {
                this.selectedMenu = "MEM";
            }
        },
        {
            id: "ROLE",
            label: 'Roles',
            icon: 'pi pi-fw pi-palette',
            command: () => {
                this.selectedMenu = "ROLE";
            }
        }
    ];

    tenant_id: string = "";
    tenant: any = {};
    credentials: any = {
        clientId: "NA",
        clientSecret: "NA",
        publicKey: "NA"
    };
    members: any = []
    isTenantAdmin = false;

    constructor(private tenantService: TenantService,
                private tokenStorageService: TokenStorageService,
                private messageService: MessageService,
                private actRoute: ActivatedRoute,
                private modalService: NgbModal) {
    }

    async ngOnInit() {
        this.tenant_id = this.actRoute.snapshot.params['tenantId'];
        if (this.tokenStorageService.isTenantAdmin()) {
            this.isTenantAdmin = true;
            this.credentials = await this.tenantService.getTenantCredentials(this.tenant_id);
        }
        const nav = this.actRoute.snapshot.queryParamMap.get("nav");
        if (nav && this.menu.find(item => item.id === nav)) {
            this.selectedMenu = nav;
        }
        console.log(this.tenant_id);
        this.tenant = await this.tenantService.getTenantDetails(this.tenant_id);
        this.members = await this.tenantService.getMembers(this.tenant_id);
    }

    async onUpdateTenant() {
        const modalRef = this.modalService.open(UpdateTenantComponent);
        modalRef.componentInstance.tenant = this.tenant;
        const editedTenant = await modalRef.result;
        console.log(editedTenant);
        await this.ngOnInit();
    }

    async onAddMember() {
        const modalRef = this.modalService.open(AddMemberComponent);
        modalRef.componentInstance.tenant = this.tenant;
        const addedMember = await modalRef.result;
        console.log(addedMember);
        await this.ngOnInit();
    }

    async onAddRole() {
        const modalRef = this.modalService.open(AddRoleComponent);
        modalRef.componentInstance.tenant = this.tenant;
        const addedRole = await modalRef.result;
        console.log(addedRole);
        await this.ngOnInit();
    }

    async onRemoveRole(role: any) {
        const modalRef = this.modalService.open(RemoveRoleComponent);
        modalRef.componentInstance.role = role;
        modalRef.componentInstance.tenant = this.tenant;
        const deletedRole = await modalRef.result;
        console.log(deletedRole);
        await this.ngOnInit();
    }

    async removeMember(user: any) {
        const modalRef = this.modalService.open(RemoveMemberComponent);
        modalRef.componentInstance.tenant = this.tenant;
        modalRef.componentInstance.member = user;
        const removedMember = await modalRef.result;
        console.log(removedMember);
        await this.ngOnInit();
    }

}
