import {Component, Input, OnInit} from '@angular/core';
import {Operator, Operators} from "./operator";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FilterValueHelpComponent} from "./filter-value-help.component";
import {Filter} from "./filter-bar.component";

export class Condition {
    operator: Operator;
    value: string;

    constructor(operator: Operator, value: string) {
        this.operator = operator;
        this.value = value;
    }
}

export class InternalFilter {

    name!: string;
    label!: string;
    conditions: Condition[] = [
        new Condition(Operators.REGEX, "")
    ];


    constructor(name: string, label: string) {
        this.name = name;
        this.label = label;
    }
}


@Component({
    selector: 'app-filter-field',
    template: `
        <div class="" style="width: 300px">
            <div class="text-truncate text-muted">
                <strong>{{ internalFilter.label }}:</strong>
            </div>
            <div class="">
                <div class="input-group-sm input-group">
                    <input class=" form-control form-control-sm border-dark-subtle"
                           [(ngModel)]="internalFilter.conditions[0].value"
                           type="text">
                    <button (click)="openValueHelp()" class="input-group-text btn btn-outline-secondary"
                            type="button">
                        <i class="fa fas fa-clone"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [`

    `],
})
export class FilterFieldComponent implements OnInit {
    readonly Operators = Operators;

    @Input() label!: string;
    @Input() name!: string;

    internalFilter!: InternalFilter;

    constructor(private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {
        this.internalFilter = new InternalFilter(this.name, this.label);
    }

    async openValueHelp() {
        const modalRef = this.modalService.open(FilterValueHelpComponent, {size: 'lg', backdrop: true});
        let modalInstance = modalRef.componentInstance as FilterValueHelpComponent;
        modalInstance.internalFilter = this.internalFilter;
        let result = await modalRef.result;
        console.log(result);
    }

    getFilters(): Filter[] {
        return this.internalFilter.conditions.map(condition => new Filter(
            this.internalFilter.name,
            this.internalFilter.label,
            condition.value,
            condition.operator.label,
        ));
    }
}



