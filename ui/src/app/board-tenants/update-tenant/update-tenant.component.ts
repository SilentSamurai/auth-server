import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {lastValueFrom} from "rxjs";
import {MessageService} from "primeng/api";
import {TenantService} from "../../_services/tenant.service";

@Component({
    selector: 'app-update-tenant',
    templateUrl: './update-tenant.component.html',
    styleUrls: ['./update-tenant.component.css']
})
export class UpdateTenantComponent implements OnInit {
    @Input() tenant: any;
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
        this.form = {
            name: this.tenant.name,
            domain: this.tenant.domain
        }
    }

    async onSubmit() {
        try {
            let editedTenant = await lastValueFrom(this.tenantService.editTenant(
                this.tenant.id,
                this.tenant.name === this.form.name ? null : this.form.name,
                this.tenant.domain === this.form.domain ? null : this.form.domain
            ));
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Tenant Updated'});
            this.passEntry.emit(editedTenant);
            this.activeModal.close(editedTenant);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Tenant Update Failed'});
        }
    }
}
