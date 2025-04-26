import {Operator, Operators} from "./Operator";


export class Filter {
    name: string;
    label: string;
    value: string;
    operator: Operator;

    constructor(name: string, label: string, value: string, operator: Operator) {
        this.name = name;
        this.label = label;
        this.value = value;
        this.operator = operator;
    }

    toJSON() {
        return {
            name: this.name,
            label: this.label,
            value: this.value,
            operator: this.operator.label,
        }
    }

    matches(otherValue: any): boolean {
        return this.operator.compare(otherValue?.toString() || "", this.value);
    }
}
