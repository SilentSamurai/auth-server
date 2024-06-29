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
import {TableAsyncLoadEvent} from "../table/app-table.component";
import {FilterBarColumnComponent} from "../filter-bar/filter-bar.component";


function parseBoolean(value: string): boolean {
    const lowerCaseStr = value.toLowerCase();
    return lowerCaseStr === 'true';
}

export class VHAsyncLoadEvent {
    filters: any;
    update!: (data: any[], selected: any[]) => void;
}


@Component({
    selector: 'app-value-help-input',
    template: `
        <div class="col-3 input-group">
            <div *ngIf="multi" class="form-control text-truncate">
                <ng-container *ngFor="let row of selection; index as i; first as isFirst">
                    <p-chip [removable]="false" label="{{getLabel(i)}}">
                    </p-chip>
                </ng-container>
            </div>
            <input *ngIf="!multi"
                   class="form-control text-truncate"
                   id="{{name}}"
                   name="{{name}}"
                   readonly
                   placeholder="{{placeholder}}"
                   required
                   type="text"
                   value="{{getLabel(0)}}"
            />
            <button (click)="openValueHelp()" class="input-group-text btn btn-outline-secondary" id="{{name}}-vh-btn"
                    type="button">
                <i class="fa fas fa-clone"></i>
            </button>
        </div>

    `,
    styles: [`
        .p-chip-text {
            line-height: 1 !important;
        }
    `],
})
export class ValueHelpInputComponent implements OnInit, AfterViewInit {

    @Input() required = false;
    @Input() name: string = '';
    @Input() multi: string | boolean = false;
    @Input() labelField!: string;
    @Input() idField!: string;
    @Input() isFilterAsync: string | boolean = true;
    @Input() placeholder: string = '';
    @Input() selection: any[] = [];
    @Output() selectionChange = new EventEmitter<any[]>();
    @Output() dataProvider = new EventEmitter<TableAsyncLoadEvent>();

    @ContentChild('vh_body')
    body: TemplateRef<any> | null = null;

    modalInstance!: ValueHelpComponent;

    @ContentChildren(ValueHelpColumnComponent)
    columns!: QueryList<ValueHelpColumnComponent>;

    @ContentChildren(FilterBarColumnComponent)
    filters!: QueryList<FilterBarColumnComponent>;

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
            this.selection = value;
            this.selectionChange.emit(this.selection);
        } else {
            this.selection = [value];
            this.selectionChange.emit(this.selection);
        }
    }

    async openValueHelp() {
        const modalRef = this.modalService.open(ValueHelpComponent, {size: 'lg', backdrop: 'static'});
        this.modalInstance = modalRef.componentInstance as ValueHelpComponent;
        this.modalInstance.body = this.body;
        this.modalInstance.onLoad = this.dataProvider;
        this.modalInstance.columns = this.columns;
        this.modalInstance.filters = this.filters;
        this.modalInstance.isFilterAsync = this.isFilterAsync as boolean;
        await this.modalInstance.startUp({
            name: this.name,
            selectedItem: this.selection,
            multi: this.multi as boolean,
            idField: this.idField
        })

        const row = await modalRef.result;
        this.changeValue(row);
        console.log(row);
    }

    getLabel(index: number) {
        if (this.selection && index >= 0 && index < this.selection.length) {
            const row = this.selection[index] as any;
            return row[this.labelField];
        }
        return "";
    }


}
