import * as yup from "yup";
import {PASSWORD_REGEXP, PASSWORD_MESSAGE, USERNAME_REGEXP, USERNAME_MESSAGE, parseDateString} from "./validation-common";

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
});

export const SignDownSchema = yup.object().shape({
    password: yup
        .string()
        .required("Password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
});

export const ForgotPasswordSchema = yup.object().shape({
    email: yup.string().email().required("Email is required").max(128),
});

export const ResetPasswordSchema = yup.object().shape({
    password: yup
        .string()
        .required("Password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
});

export const UpdateMyUsernameSchema = yup.object().shape({
    username: yup
        .string()
        .required("Username is required")
        .matches(USERNAME_REGEXP, USERNAME_MESSAGE)
        .max(128),
    password: yup
        .string()
        .required("Password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
});

export const UpdateUsernameSchema = yup.object().shape({
    username: yup
        .string()
        .required("Username is required")
        .matches(USERNAME_REGEXP, USERNAME_MESSAGE)
        .max(128),
});

export const UpdateMyEmailSchema = yup.object().shape({
    email: yup.string().email().required("Email is required").max(128),
});

export const UpdateMyPasswordSchema = yup.object().shape({
    currentPassword: yup
        .string()
        .required("Current password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
    newPassword: yup
        .string()
        .required("New password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
});

export const UpdateMyNameSchema = yup.object().shape({
    name: yup.string().defined("Name is required").max(128),
});

export const UpdateNameSchema = yup.object().shape({
    name: yup.string().defined("Name is required").max(128),
});

export const UpdateMySurnameSchema = yup.object().shape({
    surname: yup.string().defined("Name is required").max(128),
});

export const UpdateSurnameSchema = yup.object().shape({
    surname: yup.string().defined("Name is required").max(128),
});

export const UpdateMyBirthdateSchema = yup.object().shape({
    birthdate: yup
        .date()
        .required("Birthdate is required")
        .transform(parseDateString)
        .typeError("Invalid birthdate format YY/MM/DD"),
});

export const UpdateBirthdateSchema = yup.object().shape({
    birthdate: yup
        .date()
        .required("Birthdate is required")
        .transform(parseDateString)
        .typeError("Invalid birthdate format YY/MM/DD"),
});

export const DeleteUserSchema = yup.object().shape({});

export const LoginSchema = yup.object().shape({
    email: yup.string().email().required("Email is required").max(128),
    password: yup
        .string()
        .required("Password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
    client_id: yup.string().required("client_id is required"),
    csrf_token: yup.string().required("csrf_token is required"),
    subscriber_tenant_hint: yup.string().optional().max(256),
});

export const CreateUserSchema = yup.object().shape({
    email: yup.string().email().required("Email is required").max(128),
    name: yup.string().required("Name is required").max(128),
    password: yup
        .string()
        .required("Password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE),
});

export const UpdateUserSchema = yup.object().shape({
    id: yup.string().required("Id is required"),
    email: yup.string().max(128).email().nullable(),
    name: yup.string().max(128).nullable()
});

export const VerifyUserSchema = yup.object().shape({
    email: yup.string().required("Name is required").max(128),
    verify: yup.boolean().required("boolean value is required"),
});

export const UpdateUserPasswordSchema = yup.object().shape({
    password: yup
        .string()
        .required("Password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
    confirmPassword: yup.string().required("Confirm Password is required"),
});
