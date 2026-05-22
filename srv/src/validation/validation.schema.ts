import "../dto/validation-common";

import {
    CreateUserSchema,
    DeleteUserSchema,
    ForgotPasswordSchema,
    LoginSchema,
    ResetPasswordSchema,
    SignDownSchema,
    SignUpSchema,
    UpdateBirthdateSchema,
    UpdateMyBirthdateSchema,
    UpdateMyEmailSchema,
    UpdateMyNameSchema,
    UpdateMyPasswordSchema,
    UpdateMySurnameSchema,
    UpdateMyUsernameSchema,
    UpdateNameSchema,
    UpdateSurnameSchema,
    UpdateUsernameSchema,
    UpdateUserSchema,
} from "../dto/user.dto";

import {CreateTenantSchema, MemberOperationsSchema, OperatingRoleSchema, UpdateTenantSchema,} from "../dto/tenant.dto";

import {AppRoleOperationSchema, CreateRoleSchema} from "../dto/role.dto";

import {
    AuthorizeSchema,
    ClientCredentialGrantSchema,
    CodeGrantSchema,
    ConsentSchema,
    ExchangeTokenSchema,
    PasswordGrantSchema,
    RefreshTokenGrantSchema,
    RefreshTokenSchema,
    VerifyAuthCodeSchema,
    VerifyTokenSchema,
} from "../dto/oauth.dto";

import {CreateGroupSchema, UpdateGroupRole, UpdateGroupSchema, UpdateGroupUser} from "../dto/group.dto";

export {
    USERNAME_REGEXP, USERNAME_MESSAGE, PASSWORD_REGEXP, PASSWORD_MESSAGE, parseDateString
} from "../dto/validation-common";
export {VerifyUserSchema, UpdateUserPasswordSchema} from "../dto/user.dto";
export {CreateTenantV1Schema, MemberOperationSchema} from "../dto/tenant.dto";
export {UpdateRoleSchema} from "../dto/role.dto";
export {CreatePolicySchema, UpdatePolicySchema} from "../dto/policy.dto";
export {RegisterDomainSchema, SignUpSchema as RegistrationSignUpSchema} from "../dto/registration.dto";

export const ValidationSchema = {
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
    AppRoleOperationSchema,
    CreateRoleSchema,
    OperatingRoleSchema,
    MemberOperationsSchema,
    CreateUserSchema,
    UpdateUserSchema,
    VerifyTokenSchema,
    ExchangeTokenSchema,
    RefreshTokenSchema,
    CreateGroupSchema,
    UpdateGroupRole,
    UpdateGroupUser,
    UpdateGroupSchema,
    VerifyAuthCodeSchema,
    ConsentSchema,
    AuthorizeSchema,
};
