import {Operator, Operators} from './Operator';

export class Filter {
    field: string;
    label: string;
    value: string | Filter[];
    operator: Operator;

    constructor(
        field: string,
        label: string,
        value: string | Filter[],
        operator: Operator,
    ) {
        this.field = field;
        this.label = label;
        this.value = value;
        this.operator = operator;
    }

    toJSON(): any {
        return {
            field: this.field,
            label: this.label,
            value: Array.isArray(this.value)
                ? this.value.map((v) => v.toJSON())
                : this.value,
            operator: this.operator.label,
        };
    }

    matches(otherValue: any): boolean {
        if (Array.isArray(this.value)) {
            // This is a composite (AND/OR) filter
            if (this.operator.label === 'AND') {
                return this.value.every((f) => f.matches(otherValue));
            }
            if (this.operator.label === 'OR') {
                return this.value.some((f) => f.matches(otherValue));
            }
            throw new Error(
                `Unknown composite operator: ${this.operator.label}`,
            );
        } else {
            // Leaf filter
            return this.operator.compare(
                otherValue?.toString() ?? '',
                this.value,
            );
        }
    }
}

// Helper to create simple equality filter
export function eq(value: any) {
    return {operator: Operators.EQ, value: value};
}

export function gt(value: any) {
    return {operator: Operators.GT, value: value};
}

export function gte(value: any) {
    return {operator: Operators.GTE, value: value};
}

export function lt(value: any) {
    return {operator: Operators.LT, value: value};
}

export function lte(value: any) {
    return {operator: Operators.LTE, value: value};
}

export function neq(value: any) {
    return {operator: Operators.NEQ, value: value};
}

export function contains(value: any) {
    return {operator: Operators.CONTAINS, value: value};
}

export function matches(value: any) {
    return {operator: Operators.MATCHES, value: value};
}

// Helper to create a condition filter
export function condition(
    field: string,
    config: { operator: Operator; value: any },
) {
    return new Filter(field, field, config.value, config.operator);
}

// Helper to create an AND composite filter
export function and(...filters: Filter[]) {
    return new Filter('AND', 'AND', filters, Operators.AND);
}

// Helper to create an OR composite filter
export function or(...filters: Filter[]) {
    return new Filter('OR', 'OR', filters, Operators.OR);
}
