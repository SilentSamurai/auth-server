import {Component, EventEmitter, OnInit, QueryList, TemplateRef} from '@angular/core';

import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {UserService} from "../../_services/user.service";
import {LazyLoadEvent} from "primeng/api";
import {VHAsyncLoadEvent} from "../value-help-input/value-help-input.component";
import {ValueHelpColumnComponent} from "../value-help-input/value-help-column.component";

@Component({
    selector: 'app-value-help',
    templateUrl: './value-help.component.html',
    styleUrls: ['./value-help.component.css']
})
export class ValueHelpComponent implements OnInit {

    name: string = "";
    multi: boolean = true;
    selectedItem: any = [];
    body: TemplateRef<any> | null = null;
    actualRows: any[] = [];
    filteredRow: any[] = [];

    previousSelectedRows: any[] = [];
    columns!: QueryList<ValueHelpColumnComponent>;
    filterVisible: boolean = true;
    filters: any = {};
    idField!: string;
    onLoad!: EventEmitter<VHAsyncLoadEvent>;
    isFilterAsync: boolean = false;


    constructor(private userService: UserService,
                private route: ActivatedRoute,
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

    lazyLoad($event: LazyLoadEvent) {
        console.log("lazy", $event);
        this.onLoad.emit({
            filters: this.filters,
            update: this.updateVirtualData.bind(this)
        })
    }

    updateVirtualData(data: any[]) {
        this.actualRows = data;
        this.filteredRow = this.actualRows;
    }

    filter() {
        if (this.isFilterAsync) {
            this.onLoad.emit({
                filters: this.filters,
                update: this.updateVirtualData.bind(this)
            })
        } else {
            if (Object.keys(this.filters).length > 0) {
                console.log(this.filters);
                const filtered = this.actualRows.filter((row, index) => {
                    for (let field in this.filters) {
                        let value = this.filters[field];
                        let pattern = new RegExp(value, 'iug');
                        if (row.hasOwnProperty(field) && pattern.test(row[field])) {
                            return true;
                        }
                    }
                    return false;
                });
                this.filteredRow = filtered;
            }
        }

    }
}
