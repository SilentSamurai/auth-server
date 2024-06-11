import * as yup from 'yup';
import {isDate, parse} from "date-fns";

const USERNAME_REGEXP = /^[a-zA-Z]+(.){2,20}$/;
const USERNAME_MESSAGE = "Username must start with an alpha character and contain from 3 to 20 characters";

const PASSWORD_REGEXP = /^[a-zA-Z]+(.){7,20}$/;
const PASSWORD_MESSAGE = "Password must start with an alpha character and contain from 8 to 20 characters";

yup.addMethod(yup.string, 'defined', function (msg = 'Parameter must be defined') {
    return this.test('defined', msg, (value) => value !== undefined && value !== null);
});

function parseDateString(value, originalValue) {
    const parsedDate: any = isDate(originalValue) ? originalValue : parse(originalValue, "yyyy-MM-dd", new Date());
    return parsedDate;
}

const SignUpSchema = yup.object().shape(
    {
        name: yup.string().required('name is required').matches(USERNAME_REGEXP, USERNAME_MESSAGE),
        password: yup.string().required('Password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE),
        email: yup.string().email().required('Email is required')
    });

const SignDownSchema = yup.object().shape(
    {
        password: yup.string().required('Password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
    });

const ForgotPasswordSchema = yup.object().shape(
    {
        email: yup.string().email().required('Email is required')
    });

const ResetPasswordSchema = yup.object().shape(
    {
        password: yup.string().required('Password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
    });

const UpdateMyUsernameSchema = yup.object().shape(
    {
        username: yup.string().required('Username is required').matches(USERNAME_REGEXP, USERNAME_MESSAGE),
        password: yup.string().required('Password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
    });

const UpdateUsernameSchema = yup.object().shape(
    {
        username: yup.string().required('Username is required').matches(USERNAME_REGEXP, USERNAME_MESSAGE)
    });

const UpdateMyEmailSchema = yup.object().shape(
    {
        email: yup.string().email().required('Email is required')
    });

const UpdateMyPasswordSchema = yup.object().shape(
    {
        currentPassword: yup.string().required('Current password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE),
        newPassword: yup.string().required('New password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE)
    });

const UpdateMyNameSchema = yup.object().shape(
    {
        name: yup.string().defined('Name is required').max(15)
    });

const UpdateNameSchema = yup.object().shape(
    {
        name: yup.string().defined('Name is required').max(15)
    });

const UpdateMySurnameSchema = yup.object().shape(
    {
        surname: yup.string().defined('Name is required').max(15)
    });

const UpdateSurnameSchema = yup.object().shape(
    {
        surname: yup.string().defined('Name is required').max(15)
    });

const UpdateMyBirthdateSchema = yup.object().shape(
    {
        birthdate: yup.date().required('Birthdate is required').transform(parseDateString).typeError('Invalid birthdate format YY/MM/DD')
    });

const UpdateBirthdateSchema = yup.object().shape(
    {
        birthdate: yup.date().required('Birthdate is required').transform(parseDateString).typeError('Invalid birthdate format YY/MM/DD')
    });

const DeleteUserSchema = yup.object().shape(
    {});

const CreateTenantSchema = yup.object().shape(
    {
        name: yup.string().required('Name is required').max(20),
        domain: yup.string().required('Domain is required').max(100),
    });

const UpdateTenantSchema = yup.object().shape(
    {
        name: yup.string().max(20).nullable(),
        domain: yup.string().max(100).nullable(),
    });

const CreateRoleSchema = yup.object().shape(
    {
        name: yup.string().required('Name is required').max(20),
        tenantId: yup.string().required('TenantId is required'),
    });

const OperatingRoleSchema = yup.object().shape({
        scopes: yup.array().of(
            yup.string().max(20)
        )
    }
);

const MemberOperationsSchema = yup.object().shape(
    {
        tenantId: yup.string().required('TenantId is required'),
        email: yup.string().required('Email is required'),
    });

const CreateUserSchema = yup.object().shape(
    {
        email: yup.string().email().required('Email is required'),
        name: yup.string().required('Name is required').max(15),
        password: yup.string().required('Password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE),
    });

const UpdateUserSchema = yup.object().shape(
    {
        id: yup.string().required('Id is required'),
        email: yup.string().email().nullable(),
        name: yup.string().max(20).nullable(),
        password: yup.string().matches(PASSWORD_REGEXP, PASSWORD_MESSAGE).nullable(),
    });

const LoginSchema = yup.object().shape({
    email: yup.string().email().required('Email is required'),
    password: yup.string().required('Password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE),
    domain: yup.string().required('Domain is required'),
    code_challenge: yup.string().required('code_challenge is required')
});

const PasswordGrantSchema = yup.object().shape({
    grant_type: yup.string().required().matches(/^password$/g, {message: "grant type not recognised"}),
    email: yup.string().email().required('Email is required'),
    password: yup.string().required('Password is required').matches(PASSWORD_REGEXP, PASSWORD_MESSAGE),
    domain: yup.string().required('Domain is required'),
    scopes: yup.array().of(
        yup.string().max(20)
    )
});

const ClientCredentialGrantSchema = yup.object().shape({
    grant_type: yup.string().required().matches(/^client_credentials?$/g, {message: "grant type not recognised"}),
    client_id: yup.string().required('client_id is required'),
    client_secret: yup.string().required('client_secret is required'),
    scopes: yup.array().of(
        yup.string().max(20)
    )
});

const RefreshTokenGrantSchema = yup.object().shape({
    grant_type: yup.string().required().matches(/^refresh_token$/g, {message: "grant type not recognised"}),
    refresh_token: yup.string().required('refresh_token is required'),
    scopes: yup.array().of(
        yup.string().max(20)
    )
});

const CodeGrantSchema = yup.object().shape({
    grant_type: yup.string().required().matches(/^authorization_code$/g, {message: "grant type not recognised"}),
    code: yup.string().required('code is required'),
    code_verifier: yup.string().required('code_verifier is required'),
    scopes: yup.array().of(
        yup.string().max(20)
    )
});

const VerifyTokenSchema = yup.object().shape(
    {
        access_token: yup.string().required('access_token is required'),
        client_id: yup.string().required('client_id is required'),
        client_secret: yup.string().required('client_secret is required'),
    });

const ExchangeTokenSchema = yup.object().shape(
    {
        access_token: yup.string().required('access_token is required'),
        client_id: yup.string().required('client_id is required'),
        client_secret: yup.string().required('client_secret is required'),
    });

const SecurityContextSchema = yup.object().shape(
    {
        sub: yup.string().required('token is invalid'),
        email: yup.string().required('token is invalid'),
        name: yup.string().required('token is invalid'),
        tenant: yup.object().shape({
            id: yup.string().required('token is invalid'),
            name: yup.string().required('token is invalid'),
            domain: yup.string().required('token is invalid'),
        }),
        scopes: yup.array().of(
            yup.string().max(20)
        ),
        grant_type: yup.string().required('token is invalid')
    });

const RefreshTokenSchema = yup.object().shape(
    {
        email: yup.string().required('token is invalid'),
        domain: yup.string().required('token is invalid')
    });

const CreateGroupSchema = yup.object().shape(
    {
        name: yup.string().required('Name is required').max(20),
        tenantId: yup.string().required('tenantId is required').max(100),
    });

const UpdateGroupRole = yup.object().shape(
    {
        roles: yup.array().of(
            yup.string().max(20)
        )
    });

export const ValidationSchema =
    {
        SignUpSchema,
        SignDownSchema,
        LoginSchema,
        PasswordGrantSchema,
        ClientCredentialGrantSchema,
        RefreshTokenGrantSchema,
        CodeGrantSchema,
        ForgotPasswordSchema,
        ResetPasswordSchema,
        UpdateMyUsernameSchema,
        UpdateUsernameSchema,
        UpdateMyEmailSchema,
        UpdateMyPasswordSchema,
        UpdateMyNameSchema,
        UpdateNameSchema,
        UpdateMySurnameSchema,
        UpdateSurnameSchema,
        UpdateMyBirthdateSchema,
        UpdateBirthdateSchema,
        DeleteUserSchema,
        CreateTenantSchema,
        UpdateTenantSchema,
        CreateRoleSchema: CreateRoleSchema,
        OperatingRoleSchema: OperatingRoleSchema,
        MemberOperationsSchema,
        CreateUserSchema,
        UpdateUserSchema,
        VerifyTokenSchema,
        ExchangeTokenSchema,
        SecurityContextSchema,
        RefreshTokenSchema,
        CreateGroupSchema,
        UpdateGroupRole
    };
