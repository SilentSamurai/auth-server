import * as yup from "yup";
import {isDate, parse} from "date-fns";

export const USERNAME_REGEXP = /^[a-zA-Z]+(.){2,20}$/;
export const USERNAME_MESSAGE =
    "Username must start with an alpha character and contain from 3 to 20 characters";

export const PASSWORD_REGEXP = /^[a-zA-Z]+(.){7,20}$/;
export const PASSWORD_MESSAGE =
    "Password must start with an alpha character and contain from 8 to 20 characters";

yup.addMethod(
    yup.string,
    "defined",
    function (msg = "Parameter must be defined") {
        return this.test(
            "defined",
            msg,
            (value) => value !== undefined && value !== null,
        );
    },
);

export function parseDateString(value, originalValue) {
    const parsedDate: any = isDate(originalValue)
        ? originalValue
        : parse(originalValue, "yyyy-MM-dd", new Date());
    return parsedDate;
}
