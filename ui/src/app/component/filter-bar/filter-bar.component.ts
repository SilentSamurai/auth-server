import {
    AfterViewInit,
    Component,
    ContentChildren,
    EventEmitter,
    Input,
    OnInit,
    Output,
    QueryList,
    ViewChildren
} from '@angular/core';

import {Operators} from "../model/Operator";
import {Util} from "../util/utils";
import {FilterFieldComponent} from "./filter-field.component";
import {Filter} from "../model/Filters";


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
            <div class="col-md-11 col-sm-12 my-2">
                <div class="row row-cols-auto">
                    <div *ngFor="let filter of columns; index as i" class="col-auto">
                        <!--                <label class="col-sm-4 col-form-label pt-0">{{ filter.label }}</label>-->
                        <app-filter-field *ngIf="visibility"
                                          [name]="filter.name"
                                          [label]="filter.label">
                        </app-filter-field>
                    </div>
                </div>
            </div>
            <div class="col-md-1 col-sm-12 my-2 ">
                <div class="col align-content-end d-flex justify-content-end">
                    <button *ngIf="visibility"
                            (click)="onGo()" id="{{name}}FILTER_BAR_GO_BTN"
                            class="btn btn-primary btn-block btn-sm">
                        Go
                    </button>

                    <button (click)="visibility = !visibility" class="btn btn-sm px-3">
                        <i class=" fa {{ visibility ? 'fa-share' : 'fa-filter' }}"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .dropdown-toggle {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
            }
            
            .btn {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
            
            .btn-primary {
                background-color: var(--bs-primary);
                border-color: var(--bs-primary);
                color: var(--bs-primary-text);
            }
            
            .btn-primary:hover {
                background-color: var(--bs-primary-dark);
                border-color: var(--bs-primary-dark);
            }
            
            .btn:not(.btn-primary) {
                color: var(--bs-body-color);
                background-color: var(--bs-body-bg);
                border-color: var(--bs-border-color);
            }
            
            .btn:not(.btn-primary):hover {
                background-color: var(--bs-secondary-bg);
                color: var(--bs-body-color);
            }
            
            [data-bs-theme="dark"] .btn:not(.btn-primary) {
                background-color: var(--bs-dark);
                color: var(--bs-body-color);
                border-color: var(--bs-border-color);
            }
            
            [data-bs-theme="dark"] .btn:not(.btn-primary):hover {
                background-color: var(--bs-secondary-bg);
            }
        `
    ],
})
export class FilterBarComponent implements OnInit, AfterViewInit {

    Operators = Operators;

    @Input() name: string = "";

    @Input() editable: boolean | string = true;
    @Input() visibility: boolean = true;
    @Output() onFilter = new EventEmitter<Filter[]>();

    @ContentChildren(FilterBarColumnComponent)
    columns!: QueryList<FilterBarColumnComponent>;

    @ViewChildren(FilterFieldComponent)
    filterFields!: QueryList<FilterFieldComponent>;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
        if (typeof this.editable === 'string') {
            this.editable = Util.parseBoolean(this.editable);
        }
        if (this.name.length > 0) {
            this.name = this.name + "_";
        }
    }

    ngAfterViewInit(): void {

    }

    getFilters() {
        return this.filterFields
            .toArray()
            .flatMap((ff: FilterFieldComponent) => ff.getFilters());
    }

    onGo() {
        let outFilters = this.getFilters();
        this.onFilter.emit(outFilters);
    }


}



