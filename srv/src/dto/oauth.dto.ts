import * as yup from "yup";
import {PASSWORD_MESSAGE, PASSWORD_REGEXP} from "./validation-common";

export const PasswordGrantSchema = yup.object().shape({
    grant_type: yup
        .string()
        .required()
        .matches(/^password$/g, {message: "grant type not recognised"}),
    username: yup.string().email().required("Username is required").max(128),
    password: yup
        .string()
        .required("Password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
    client_id: yup.string().required("client_id is required"),
    // Required at runtime for confidential clients; public clients do not
    // possess a secret. The controller resolves the client type before
    // applying that conditional requirement.
    client_secret: yup.string().optional().max(512),
    subscriber_tenant_hint: yup.string().nullable(),
    scope: yup.string().optional(),
    resource: yup.string().optional(),
});

export const ClientCredentialGrantSchema = yup.object().shape({
    grant_type: yup
        .string()
        .required()
        .matches(/^client_credentials$/g, {
            message: "grant type not recognised",
        }),
    client_id: yup.string().required("client_id is required"),
    client_secret: yup.string().required("client_secret is required"),
    scope: yup.string().optional(),
    resource: yup.string().optional(),
});

export const RefreshTokenGrantSchema = yup.object().shape({
    grant_type: yup
        .string()
        .required()
        .matches(/^refresh_token$/g, {message: "grant type not recognised"}),
    refresh_token: yup.string().required("refresh_token is required"),
    client_id: yup.string().required("client_id is required"),
    client_secret: yup.string().optional(),
    scope: yup.string().optional(),
    resource: yup.string().optional(),
});

export const CodeGrantSchema = yup.object().shape({
    grant_type: yup
        .string()
        .required()
        .matches(/^authorization_code$/g, {
            message: "grant type not recognised",
        }),
    code: yup.string().required("code is required"),
    code_verifier: yup.string()
        .optional()
        .min(43, "code_verifier must be at least 43 characters")
        .max(128, "code_verifier must be at most 128 characters")
        .matches(/^[A-Za-z0-9\-._~]+$/, "code_verifier contains invalid characters"),
    client_id: yup.string().required("client_id is required"),
    subscriber_tenant_hint: yup.string().nullable(),
    scope: yup.string().optional(),
    redirect_uri: yup.string().optional(),
    resource: yup.string().optional(),
});

export const VerifyTokenSchema = yup.object().shape({
    access_token: yup.string().required("access_token is required"),
    client_id: yup.string().required("client_id is required"),
    client_secret: yup.string().required("client_secret is required"),
});

export const ExchangeTokenSchema = yup.object().shape({
    access_token: yup.string().required("access_token is required"),
    client_id: yup.string().required("client_id is required"),
    client_secret: yup.string().required("client_secret is required"),
});

export const RefreshTokenSchema = yup.object().shape({
    email: yup.string().required("token is invalid").max(128),
    domain: yup.string().required("token is invalid"),
});

export const VerifyAuthCodeSchema = yup.object().shape({
    auth_code: yup.string().required("auth_code is required"),
    client_id: yup.string().required("client_id is required"),
});

export const ConsentSchema = yup.object().shape({
    email: yup.string().email().required("Email is required").max(128),
    password: yup
        .string()
        .required("Password is required")
        .matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
        .max(128),
    client_id: yup.string().required("client_id is required"),
    code_challenge: yup.string().optional(),
    code_challenge_method: yup
        .string()
        .optional()
        .matches(/^(plain|S256)$/, "method must be plain or S256"),
    approved_scopes: yup
        .array()
        .of(yup.string())
        .required("approved_scopes is required"),
    consent_action: yup
        .string()
        .required()
        .matches(/^(approve|deny)$/, "consent_action must be 'approve' or 'deny'"),
    redirect_uri: yup.string().optional(),
    scope: yup.string().optional(),
    nonce: yup.string().optional().max(512),
    subscriber_tenant_hint: yup.string().optional().nullable(),
    prompt: yup.string().optional(),
    resource: yup.string().optional(),
});

export const AuthorizeSchema = yup.object().shape({
    response_type: yup
        .string()
        .required("response_type is required")
        .oneOf(["code"], "The response_type parameter must be \"code\""),
    client_id: yup
        .string()
        .required("client_id is required")
        .min(1, "client_id must not be empty"),
    redirect_uri: yup
        .string()
        .optional(),
    scope: yup
        .string()
        .optional(),
    state: yup
        .string()
        .optional(),
    code_challenge: yup
        .string()
        .optional(),
    code_challenge_method: yup
        .string()
        .optional()
        .oneOf(["plain", "S256"], "code_challenge_method must be one of: plain, S256"),
    nonce: yup
        .string()
        .optional(),
    prompt: yup
        .string()
        .optional(),
    max_age: yup
        .number()
        .optional()
        .integer("max_age must be an integer")
        .min(0, "max_age must be a non-negative integer"),
    resource: yup
        .string()
        .optional(),
});
