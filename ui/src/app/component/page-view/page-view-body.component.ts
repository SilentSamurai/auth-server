import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfirmationService, MessageService} from "primeng/api";

@Component({
    selector: 'app-page-view-body',
    template: `
        <ng-template #PVB>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [''],
    providers: []
})
export class PageViewBodyComponent implements OnInit {

    loading = true;

    @ViewChild('PVB', {static: true}) template!: TemplateRef<any>;

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
