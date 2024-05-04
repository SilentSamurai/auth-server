import {Component, EventEmitter, OnInit, TemplateRef} from '@angular/core';

import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {UserService} from "../../_services/user.service";
import {LazyLoadEvent} from "primeng/api";
import {Filter} from "../value-help-input/value-help-input.component";

@Component({
    selector: 'app-value-help',
    templateUrl: './value-help.component.html',
    styleUrls: ['./value-help.component.css']
})
export class ValueHelpComponent implements OnInit {

    name: string = "";
    data: any[] = [];
    multi: boolean = true;
    selectedItem: any = [];
    header: TemplateRef<any> | null = null;
    body: TemplateRef<any> | null = null;
    virtualData: any[] = [];

    previousSelectedRows: any[] = [];
    columns = ["Email", "Name"];
    filterVisible: boolean = true;
    onFilter: EventEmitter<Filter> | null = null;
    filters: any = {};
    idField!: string;
    onLoad!: EventEmitter<Filter>;


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
        data: any[];
        selectedItem: any[];
        name: string;
        multi: boolean
    }): Promise<any> {
        this.idField = params.idField;
        this.name = params.name;
        this.multi = params.multi
        this.previousSelectedRows = Array.from(params.selectedItem);
        this.selectedItem = Array.from(params.selectedItem);
        this.data = params.data;
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
        this.onLoad.emit(this.filters)
    }

    updateVirtualData(data: any[]) {
        this.virtualData = data;
    }

    filter() {
        this.onFilter?.emit(this.filters);
    }
}
