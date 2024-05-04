import {Component, ContentChild, EventEmitter, Input, OnInit, Output, TemplateRef} from '@angular/core';

import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {UserService} from "../../_services/user.service";
import {ValueHelpComponent} from "../value-help/value-help.component";


function parseBoolean(value: string): boolean {
    const lowerCaseStr = value.toLowerCase();
    return lowerCaseStr === 'true';
}

export class Filter {

}


@Component({
    selector: 'app-value-help-input',
    templateUrl: './value-help-input.component.html',
    styleUrls: ['./value-help-input.component.scss']
})
export class ValueHelpInputComponent implements OnInit {

    @Input() name: string = '';
    @Input() multi: string | boolean = false;
    @Input() labelField!: string;
    @Input() idField!: string;
    @Output() onSelect = new EventEmitter<any[]>();
    @Output() onFilter = new EventEmitter<Filter>();
    @Output() onLoad = new EventEmitter<Filter>();
    @ContentChild('vh_header')
    header: TemplateRef<any> | null = null;
    @ContentChild('vh_body')
    body: TemplateRef<any> | null = null;
    selectedRows: any[] = [];
    modalInstance!: ValueHelpComponent;

    _data: any[] = [];

    @Input() set data(value: any[]) {
        this._data = value;
        if (this.modalInstance) {
            this.modalInstance.updateVirtualData(this._data);
        }
    }

    constructor(private userService: UserService,
                private route: ActivatedRoute,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        if (typeof this.multi === 'string') {
            this.multi = parseBoolean(this.multi);
        }
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
        this.modalInstance.header = this.header;
        this.modalInstance.body = this.body;
        this.modalInstance.onFilter = this.onFilter;
        this.modalInstance.onLoad = this.onLoad;
        await this.modalInstance.startUp({
            name: this.name,
            selectedItem: this.selectedRows,
            multi: this.multi as boolean,
            data: this.data,
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
