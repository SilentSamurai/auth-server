export class Operator {
    label: string;
    symbol: string;


    constructor(label: string, operator: string) {
        this.label = label;
        this.symbol = operator;
    }

    compare(a: any, b: any): boolean {
        switch (this.label) {
            case 'equals':
                return a === b;
            case 'greaterThan':
                return a > b;
            case 'greaterThanEqual':
                return a >= b;
            case 'lessThan':
                return a < b;
            case 'lessThanEquals':
                return a <= b;
            case 'notEquals':
                return a !== b;
            case 'contains':
                if (typeof a === 'string' && typeof b === 'string') {
                    return a.includes(b);
                }
                if (Array.isArray(a)) {
                    return a.includes(b);
                }
                return false;
            case 'regex':

                return false;
            default:
                return false;
        }
    }

}

export class Operators {

    public static REGEX: Operator = new Operator("regex", "=*");
    public static EQ: Operator = new Operator("equals", "=");
    public static GT: Operator = new Operator("greaterThan", ">");
    public static GTE: Operator = new Operator("greaterThanEqual", ">=");
    public static LT: Operator = new Operator("lessThan", "<");
    public static LTE: Operator = new Operator("lessThanEquals", "<=");
    public static NEQ: Operator = new Operator("notEquals", "!=");
    public static CONTAINS: Operator = new Operator("contains", "contains");


    static ALL_OPERATORS: Operator[] = [
        Operators.EQ,
        Operators.GT,
        Operators.GTE,
        Operators.LT,
        Operators.LTE,
        Operators.NEQ,
        Operators.CONTAINS,
        Operators.REGEX
    ]

    static operatorFromLabel(label: string): Operator {
        let found = Operators.ALL_OPERATORS.filter(opr => opr.label === label);
        if (found && found.length > 0) {
            return found[0];
        }
        return Operators.REGEX;
    }

    static operatorFromSymbol(symbol: string): Operator {
        let found = Operators.ALL_OPERATORS.filter(opr => opr.symbol === symbol);
        if (found && found.length > 0) {
            return found[0];
        }
        return Operators.REGEX;
    }
}
