import {AfterViewInit, Component, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfirmationService, MessageService} from "primeng/api";

@Component({
    selector: 'app-object-page-subtitle',
    template: `
        <ng-template #OPTT>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: ['']
})
export class ObjectPageSubTitleComponent implements AfterViewInit {

    isTemplateActive: boolean = true;


    @ViewChild('OPTT', {static: true}) template!: TemplateRef<any>;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private modalService: NgbModal) {
    }

    ngAfterViewInit(): void {
    }

}
