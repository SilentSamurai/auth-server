import "../dto/validation-common";

import {
    SignUpSchema, SignDownSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema,
    UpdateMyUsernameSchema, UpdateUsernameSchema, UpdateMyEmailSchema, UpdateMyPasswordSchema,
    UpdateMyNameSchema, UpdateNameSchema, UpdateMySurnameSchema, UpdateSurnameSchema,
    UpdateMyBirthdateSchema, UpdateBirthdateSchema, DeleteUserSchema, CreateUserSchema, UpdateUserSchema,
} from "../dto/user.dto";

import {
    CreateTenantSchema, UpdateTenantSchema, MemberOperationsSchema, OperatingRoleSchema,
} from "../dto/tenant.dto";

import {CreateRoleSchema} from "../dto/role.dto";

import {
    PasswordGrantSchema, ClientCredentialGrantSchema, RefreshTokenGrantSchema, CodeGrantSchema,
    VerifyTokenSchema, ExchangeTokenSchema, RefreshTokenSchema, VerifyAuthCodeSchema,
    ConsentSchema, AuthorizeSchema,
} from "../dto/oauth.dto";

import {CreateGroupSchema, UpdateGroupSchema, UpdateGroupRole, UpdateGroupUser} from "../dto/group.dto";

export {USERNAME_REGEXP, USERNAME_MESSAGE, PASSWORD_REGEXP, PASSWORD_MESSAGE, parseDateString} from "../dto/validation-common";
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
