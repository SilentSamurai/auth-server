export class Operators {

    static OPERATORS = [
        {
            label: "=",
            operator: "equals"
        },
        {
            label: ">",
            operator: "greaterThan"
        },
        {
            label: ">=",
            operator: "greaterThanEqual"
        },
        {
            label: "<",
            operator: "lessThan"
        },
        {
            label: "<=",
            operator: "lessThanEquals"
        },
        {
            label: "!=",
            operator: "notEquals"
        },
        {
            label: "contains",
            operator: "contains"
        },
        {
            label: ".*",
            operator: "Regex"
        }
    ]

    static symbolFromOperator(operator: string): string {
        let found = Operators.OPERATORS.filter(opr => opr.operator === operator);
        if (found && found.length > 0) {
            return found[0].label;
        }
        return "";
    }

    static operatorFromSymbol(label: string): string {
        let found = Operators.OPERATORS.filter(opr => opr.label === label);
        if (found && found.length > 0) {
            return found[0].operator;
        }
        return "";
    }
}
