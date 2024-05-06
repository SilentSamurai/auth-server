import {
    AfterViewInit,
    Component,
    ContentChild,
    ContentChildren,
    EventEmitter,
    Input,
    OnInit,
    Output,
    QueryList,
    TemplateRef
} from '@angular/core';

import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {UserService} from "../../_services/user.service";
import {ValueHelpComponent} from "../value-help/value-help.component";
import {ValueHelpColumnComponent} from "./value-help-column.component";


function parseBoolean(value: string): boolean {
    const lowerCaseStr = value.toLowerCase();
    return lowerCaseStr === 'true';
}

export class VHAsyncLoadEvent {
    filters: any;
    update: any;
}


@Component({
    selector: 'app-value-help-input',
    template: `
        <div class="input-group">
            <label class="col-3 col-form-label" for="{{name}}">
                {{ name }}
            </label>

            <div class="col-3 input-group">
                <div *ngIf="multi" class="form-control text-truncate">
                    <ng-container *ngFor="let row of selectedRows; index as i; first as isFirst">
                        <p-chip [removable]="false" label="{{getLabel(i)}}">
                        </p-chip>
                    </ng-container>
                </div>

                <input *ngIf="!multi"
                       class="form-control text-truncate"
                       id="{{name}}"
                       name="{{name}}"
                       readonly
                       required
                       type="text"
                       value="{{getLabel(0)}}"
                />

                <button (click)="openValueHelp()" class="input-group-text btn btn-outline-secondary"
                        type="button">
                    <i class="fa fas fa-clone"></i>
                </button>
            </div>
        </div>

    `,
    styles: [`
        .p-chip-text {
            line-height: 1 !important;
        }
    `],
})
export class ValueHelpInputComponent implements OnInit, AfterViewInit {

    @Input() name: string = '';
    @Input() multi: string | boolean = false;
    @Input() labelField!: string;
    @Input() idField!: string;
    @Input() isFilterAsync: string | boolean = false;
    @Output() onSelect = new EventEmitter<any[]>();
    @Output() dataProvider = new EventEmitter<VHAsyncLoadEvent>();

    @ContentChild('vh_body')
    body: TemplateRef<any> | null = null;

    selectedRows: any[] = [];
    modalInstance!: ValueHelpComponent;

    @ContentChildren(ValueHelpColumnComponent)
    columns!: QueryList<ValueHelpColumnComponent>;

    constructor(private userService: UserService,
                private route: ActivatedRoute,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        if (typeof this.multi === 'string') {
            this.multi = parseBoolean(this.multi);
        }
        if (typeof this.isFilterAsync === 'string') {
            this.isFilterAsync = parseBoolean(this.isFilterAsync);
        }
    }

    ngAfterViewInit(): void {
        console.log(this.columns?.length);
    }

    changeValue(value: any | any[]) {
        if (!value) {
            return;
        }
        if (Array.isArray(value)) {
            this.selectedRows = value;
            this.onSelect.emit(this.selectedRows);
        } else {
            this.selectedRows = [value];
            this.onSelect.emit(this.selectedRows);
        }
    }

    async openValueHelp() {
        const modalRef = this.modalService.open(ValueHelpComponent, {size: 'lg', backdrop: 'static'});
        this.modalInstance = modalRef.componentInstance as ValueHelpComponent;
        this.modalInstance.body = this.body;
        this.modalInstance.onLoad = this.dataProvider;
        this.modalInstance.columns = this.columns;
        this.modalInstance.isFilterAsync = this.isFilterAsync as boolean;
        await this.modalInstance.startUp({
            name: this.name,
            selectedItem: this.selectedRows,
            multi: this.multi as boolean,
            idField: this.idField
        })

        const row = await modalRef.result;
        this.changeValue(row);
        console.log(row);
    }

    getLabel(index: number) {
        if (this.selectedRows && index >= 0 && index < this.selectedRows.length) {
            const row = this.selectedRows[index] as any;
            return row[this.labelField];
        }
        return "";
    }


}
