export class Operator {
    label: string;
    symbol: string;


    constructor(label: string, operator: string) {
        this.label = label;
        this.symbol = operator;
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
    public static CONTRAINS: Operator = new Operator("contains", "contains");


    static ALL_OPERATORS: Operator[] = [
        Operators.EQ,
        Operators.GT,
        Operators.GTE,
        Operators.LT,
        Operators.LTE,
        Operators.NEQ,
        Operators.CONTRAINS,
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
