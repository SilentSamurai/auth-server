import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {lastValueFrom} from "rxjs";
import {TenantService} from "../../../_services/tenant.service";
import {MessageService} from "primeng/api";

@Component({
    selector: 'app-create-tenant',
    templateUrl: './create-tenant.component.html',
    styleUrls: ['./create-tenant.component.css']
})
export class CreateTenantComponent implements OnInit {
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form = {
        name: "",
        domain: ""
    }

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    async onSubmit() {
        try {
            const createdTenant = await lastValueFrom(this.tenantService.createTenant(this.form.name, this.form.domain));
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Created'});
            this.passEntry.emit(createdTenant);
            this.activeModal.close(createdTenant);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Creation Failed'});
        }
    }
}
