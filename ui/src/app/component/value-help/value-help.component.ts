import {Component, EventEmitter, OnInit, QueryList, TemplateRef} from '@angular/core';

import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {ValueHelpColumnComponent} from "../value-help-input/value-help-column.component";
import {TableAsyncLoadEvent} from "../table/table.component";

@Component({
    selector: 'app-value-help',
    template: `
        <div>
            <div class="row p-2 pb-0">
                <div class="col">
                    <div class="d-flex justify-content-between">
                        <div class="h4 mb-0">{{ name }}</div>
                        <button (click)="cancel()"
                                aria-label="Close"
                                class="btn-close text-bg-secondary"
                                type="button"></button>
                    </div>
                </div>
            </div>
            <app-table
                [idField]="idField"
                [multi]="multi"
                [isFilterAsync]="isFilterAsync"
                (onLoad)="lazyLoad($event)"
                [(selection)]="selectedItem">
                <app-table-col *ngFor="let col of columns"
                               label="{{col.label}}"
                               name="{{col.name}}"
                               isId="{{col.isId}}"
                >
                    <ng-template #table_body let-row>
                        <ng-container *ngTemplateOutlet="body; context: {$implicit: row}"></ng-container>
                    </ng-template>
                </app-table-col>
            </app-table>
            <div class="row">
                <div class="col">
                    <div class="gap-2 p-2 justify-content-end d-flex">
                        <button (click)="clear()"
                                class="btn btn-outline-secondary btn-block btn-sm">
                            Clear
                        </button>
                        <button (click)="confirm()"
                                class="btn btn-primary btn-block btn-sm">
                            Select
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        ``
    ]
})
export class ValueHelpComponent implements OnInit {

    name: string = "";
    multi: boolean = true;

    body: TemplateRef<any> | null = null;

    selectedItem: any[] = [];
    previousSelectedRows: any[] = [];

    columns!: QueryList<ValueHelpColumnComponent>;
    idField!: string;
    onLoad!: EventEmitter<TableAsyncLoadEvent>;
    isFilterAsync: boolean = false;


    constructor(private route: ActivatedRoute,
                private activeModal: NgbActiveModal,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        // this.data = await lastValueFrom(this.userService.getAllUsers())
        console.log("multi", this.multi)
    }

    async startUp(params: {
        idField: string;
        selectedItem: any[];
        name: string;
        multi: boolean
    }): Promise<any> {
        this.idField = params.idField;
        this.name = params.name;
        this.multi = params.multi
        this.previousSelectedRows = Array.from(params.selectedItem);
        this.selectedItem = Array.from(params.selectedItem);
    }

    cancel() {
        this.activeModal.close(this.previousSelectedRows);
    }

    confirm() {
        this.activeModal.close(this.selectedItem);
    }

    clear() {
        this.activeModal.close([]);
    }

    lazyLoad($event: TableAsyncLoadEvent) {
        console.log("lazy", $event);
        this.onLoad.emit($event)
    }
}
