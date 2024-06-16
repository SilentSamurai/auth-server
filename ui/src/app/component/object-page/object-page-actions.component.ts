import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfirmationService, MessageService} from "primeng/api";

@Component({
    selector: 'app-object-page-actions',
    template: `
        <ng-template #OPTA>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [''],
    providers: []
})
export class ObjectPageActionsComponent implements OnInit {

    loading = true;

    @ViewChild('OPTA', {static: true}) template!: TemplateRef<any>;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private modalService: NgbModal) {
    }

    async ngOnInit() {
        this.loading = true;
        this.loading = false;
    }

}
