import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "primeng/api";
import {TenantService} from "../../../_services/tenant.service";

@Component({
    selector: 'delete-tenant-modal',
    templateUrl: './remove-scope.component.html',
    styleUrls: ['./remove-scope.component.css']
})
export class RemoveScopeComponent implements OnInit {
    @Input() scope: any;
    @Output() passEntry: EventEmitter<any> = new EventEmitter();

    constructor(private tenantService: TenantService,
                private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        console.log(this.scope);
    }

    async onYes() {
        try {
            let deletedScope = await this.tenantService.removeScope(this.scope.id);
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Scope Deleted'});
            this.passEntry.emit(deletedScope);
            this.activeModal.close(deletedScope);
        } catch (e) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Scope Deletion Failed'});
        }

    }
}
