import * as yup from "yup";

export const CreateTenantSchema = yup.object().shape({
    name: yup.string().required("Name is required").max(20),
    domain: yup.string().required("Domain is required").max(100),
});

export const UpdateTenantSchema = yup.object().shape({
    name: yup.string().max(128),
    allowSignUp: yup.boolean(),
});

export const CreateTenantV1Schema = yup.object().shape({
    name: yup.string().max(20).required(),
});

export const MemberOperationSchema = yup.object().shape({
    emails: yup.array().of(yup.string().max(128)),
});

export const MemberOperationsSchema = yup.object().shape({
    tenantId: yup.string().required("TenantId is required"),
    email: yup.string().required("Email is required").max(128),
});

export const OperatingRoleSchema = yup.object().shape({
    roles: yup.array().of(yup.string().required().max(100)).required(),
});
