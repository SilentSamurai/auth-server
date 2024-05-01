import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../../_services/tenant.service";

@Component({
    selector: 'app-create-tenant',
    templateUrl: './add-scope.component.html',
    styleUrls: ['./add-scope.component.css']
})
export class AddScopeComponent implements OnInit {

    @Input() readonly tenant: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    form = {
        name: ""
    }

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit(): void {
    }

    async onSubmit() {
        try {
            const addedScope = await this.tenantService.addScope(this.form.name, this.tenant.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Scope Added'});
            this.passEntry.emit(addedScope);
            this.activeModal.close(addedScope);
        } catch (e) {
            console.error(e)
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to add scope'});
        }
    }
}
