import {AfterViewInit, Component, ContentChildren, EventEmitter, Input, OnInit, Output, QueryList} from '@angular/core';

import {Operators} from "./operator";

function parseBoolean(value: string): boolean {
    const lowerCaseStr = value.toLowerCase();
    return lowerCaseStr === 'true';
}

export class Filter {
    name: string;
    label: string;
    value: string;
    operator: string;

    constructor(name: string, label: string, value: string, operator: string) {
        this.name = name;
        this.label = label;
        this.value = value;
        this.operator = operator;
    }
}

@Component({
    selector: 'app-fb-col',
    template: '',
    styles: [],
})
export class FilterBarColumnComponent implements OnInit {

    @Input() label: string = '';
    @Input() name: string = '';

    constructor() {
    }

    async ngOnInit(): Promise<void> {
    }

}

@Component({
    selector: 'app-fb',
    template: `
        <div class="row">
            <div class="col">
                <div class="col align-content-end d-flex justify-content-end">
                    <button *ngIf="visibility" (click)="onGo()" class="btn btn-primary btn-block btn-sm">
                        Go
                    </button>

                    <button (click)="visibility = !visibility" class="btn btn-sm px-3">
                        <i class=" fa {{ visibility ? 'fa-share' : 'fa-filter' }}"></i>
                    </button>
                </div>
            </div>
        </div>
        <div *ngIf="visibility" class="row px-2 pt-0 pb-1 row-cols-auto">
            <div *ngFor="let filter of filters; index as i" class="col pt-1">
                <!--                <label class="col-sm-4 col-form-label pt-0">{{ filter.label }}</label>-->
                <div class="input-group-sm input-group">

                    <button class="btn btn-sm " (click)="removeFilter(i)" *ngIf="editable">
                        <i class="fa fa-close"></i>
                    </button>

                    <ng-container *ngIf="editable">
                        <button aria-expanded="false"
                                class="btn btn-outline-secondary dropdown-toggle text-start"
                                data-bs-toggle="dropdown" ngbDropdown ngbDropdownToggle
                                style="min-width: 6rem"
                                type="button">

                            <b class="">
                                {{ filter.label }}
                            </b>
                            <ul class="dropdown-menu " ngbDropdownMenu>
                                <li *ngFor="let col of columns"
                                    (click)="filter.name = col.name; filter.label = col.label">
                                    <a class="dropdown-item ">
                                        {{ col.label }}
                                    </a>
                                </li>
                            </ul>
                        </button>
                    </ng-container>

                    <ng-container *ngIf="!editable">
                        <span class="input-group-text border-dark-subtle "
                              style="min-width: 6rem">
                            {{ filter.label }}
                        </span>
                    </ng-container>


                    <button aria-expanded="false"
                            class="btn btn-outline-secondary dropdown-toggle text-start"
                            data-bs-toggle="dropdown" ngbDropdown ngbDropdownToggle
                            type="button">

                        <b class="">
                            {{ Operators.symbolFromOperator(filter.operator) }}
                        </b>
                        <ul class="dropdown-menu " ngbDropdownMenu>
                            <li *ngFor="let opr of Operators.OPERATORS"
                                (click)="filter.operator = opr.operator">
                                <a class="dropdown-item ">
                                    {{ opr.label }}
                                </a>
                            </li>
                        </ul>
                    </button>

                    <input [(ngModel)]="filter.value"
                           class="col-sm-8 form-control form-control-sm"
                           type="text">
                </div>
            </div>
            <div class="col pt-1" *ngIf="editable">
                <button (click)="addFilter()" *ngIf="visibility"
                        class="btn btn-sm text-success ">
                    <i class="fa fa-plus-circle"></i>
                </button>
            </div>
        </div>
    `,
    styles: [
        `
            .dropdown-toggle {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
            }
        `
    ],
})
export class FilterBarComponent implements OnInit, AfterViewInit {

    Operators = Operators;

    @Input() editable: boolean | string = true;
    @Input() visibility: boolean = true;
    @Output() onFilter = new EventEmitter<Filter[]>();

    filters: Filter[] = [];


    @ContentChildren(FilterBarColumnComponent)
    columns!: QueryList<FilterBarColumnComponent>;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
        if (typeof this.editable === 'string') {
            this.editable = parseBoolean(this.editable);
        }
    }

    ngAfterViewInit(): void {
        for (const col of this.columns) {
            let filter = new Filter(col.name, col.label,
                "",
                Operators.operatorFromSymbol("=")
            );
            this.filters.push(filter);
        }
    }

    getFilters() {
        return this.filters;
    }

    onGo() {
        let outFilters = this.getFilters();
        this.onFilter.emit(outFilters);
    }


    addFilter() {
        if (this.columns.length > 0) {
            let filter = new Filter(
                this.columns.first.name,
                this.columns.first.label,
                "",
                Operators.operatorFromSymbol("=")
            );
            this.filters.push(filter)
        }
    }

    removeFilter(index: number) {
        this.filters.splice(index, 1);
    }
}



