import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";
import {TokenStorageService} from "../../../_services/token-storage.service";
import {UpdateTenantComponent} from "../update-tenant.component";
import {AddMemberComponent} from "./add-member/add-member.component";
import {AddScopeComponent} from "./add-scope/add-scope.component";
import {RemoveScopeComponent} from "./remove-scope/remove-scope.component";
import {RemoveMemberComponent} from "./remove-member/remove-member.component";

@Component({
    selector: 'view-tenant',
    templateUrl: './view-tenant.component.html',
    styleUrls: ['./view-tenant.component.css']
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

    async onAddScope() {
        const modalRef = this.modalService.open(AddScopeComponent);
        modalRef.componentInstance.tenant = this.tenant;
        const addedScope = await modalRef.result;
        console.log(addedScope);
        await this.ngOnInit();
    }

    async onRemoveScope(scope: any) {
        const modalRef = this.modalService.open(RemoveScopeComponent);
        modalRef.componentInstance.scope = scope;
        modalRef.componentInstance.tenant = this.tenant;
        const deletedScope = await modalRef.result;
        console.log(deletedScope);
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
