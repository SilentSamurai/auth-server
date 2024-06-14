import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfirmationService, MessageService} from "primeng/api";

@Component({
    selector: 'app-object-page-section',
    template: `
        <ng-template #OPS>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [''],
    providers: []
})
export class ObjectPageSectionComponent implements OnInit {

    @Input() name: string = "";

    loading = true;
    @ViewChild('OPS', {static: true}) template!: TemplateRef<any>;

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
