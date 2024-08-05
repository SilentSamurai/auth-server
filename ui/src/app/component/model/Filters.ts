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
}
