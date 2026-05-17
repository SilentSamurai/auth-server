import * as yup from "yup";
import {PASSWORD_REGEXP, PASSWORD_MESSAGE, USERNAME_REGEXP, USERNAME_MESSAGE} from "./validation-common";

export const RegisterDomainSchema = yup.object().shape({
    name: yup
        .string()
        .required("name is required")
        .max(128)
        .matches(USERNAME_REGEXP, USERNAME_MESSAGE),
    password: yup
        .string()
        .required("Password is required")
        .max(128)
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE),
    email: yup.string().email().required("Email is required").max(128),
    orgName: yup.string().required("Org name is required").max(128),
    domain: yup.string().required("Domain is required").max(128),
});

export const SignUpSchema = yup.object().shape({
    name: yup
        .string()
        .required("name is required")
        .max(128)
        .matches(USERNAME_REGEXP, USERNAME_MESSAGE),
    password: yup
        .string()
        .required("Password is required")
        .max(128)
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE),
    email: yup.string().email().required("Email is required").max(128),
    client_id: yup.string().required("Client Id is required").max(128),
});
