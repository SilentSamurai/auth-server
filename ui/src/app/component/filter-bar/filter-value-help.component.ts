import {Component, Input, OnInit} from '@angular/core';
import {Operators} from "./operator";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {InternalFilter} from "./filter-field.component";


@Component({
    selector: 'app-fvh',
    template: `
        <div class="modal-header pb-0 bg-primary-subtle">
            <div class="container-fluid">
                <div class="row">
                    <div class="col d-flex justify-content-between ">
                        <div class="mb-0 modal-title">
                            Filter: {{ internalFilter.label }}
                        </div>
                        <button (click)="cancel()"
                                aria-label="Close"
                                class="btn btn-sm "
                                type="button">
                            <span aria-hidden="true">
                                <i class="fa fa-icons fa-close"></i>
                            </span>
                        </button>
                    </div>
                </div>
                <div class="row">
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active bg-primary-subtle tab-bottom-color"
                                    data-bs-toggle="tab"
                                    data-bs-target="#conditions"
                                    type="button" role="tab" aria-controls="conditions" aria-selected="true">
                                Define Conditions
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
        <div class="modal-body tab-content">
            <div class="tab-pane fade show active" id="conditions" role="tabpanel" aria-labelledby="conditions-tab">

                <div class="row my-2" *ngFor="let condition of internalFilter.conditions; index as i">
                    <div class="col">
                        <button aria-expanded="false"
                                class="btn btn-outline-secondary dropdown-toggle text-start"
                                data-bs-toggle="dropdown" ngbDropdown ngbDropdownToggle
                                type="button">

                            <b class="">
                                {{ condition.operator.label }}
                            </b>
                            <ul class="dropdown-menu " ngbDropdownMenu>
                                <li *ngFor="let opr of Operators.ALL_OPERATORS"
                                    (click)="condition.operator = opr">
                                    <a class="dropdown-item ">
                                        {{ opr.label }}
                                    </a>
                                </li>
                            </ul>
                        </button>
                    </div>

                    <div class="col">
                        <input type="text" [(ngModel)]="condition.value" class="form-control" placeholder="">
                    </div>

                    <div class="col">
                        <button class="btn btn-sm " (click)="removeFilter(i)">
                            <i class="fa fa-close"></i>
                        </button>
                    </div>
                </div>

                <div class="row my-2">
                    <div class="col">
                        <button (click)="addFilter()"
                                class="btn btn-sm btn-outline-success">
                            <i class="fa fa-plus-circle"></i> Add Condition
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer p-0">
            <button (click)="confirm()"
                    class="btn btn-primary btn-block btn-sm">
                Done
            </button>
        </div>
    `,
    styles: [],
})
export class FilterValueHelpComponent implements OnInit {

    @Input() internalFilter!: InternalFilter;

    readonly Operators = Operators;

    constructor(
        private activeModal: NgbActiveModal,
    ) {
    }

    async ngOnInit(): Promise<void> {
    }

    openValueHelp() {

    }

    cancel() {
        this.activeModal.close();
    }

    addFilter() {
        this.internalFilter.conditions.push({
            operator: Operators.operatorFromSymbol("=*"),
            value: ""
        })
    }

    removeFilter(index: number) {
        if (this.internalFilter.conditions.length > 1) {
            this.internalFilter.conditions.splice(index, 1);
        }
    }

    confirm() {
        this.activeModal.close(this.internalFilter);
    }
}



