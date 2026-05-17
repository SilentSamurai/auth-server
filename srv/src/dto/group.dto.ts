import * as yup from "yup";

export const CreateGroupSchema = yup.object().shape({
    name: yup.string().required("Name is required").max(128),
    tenantId: yup.string().required("tenantId is required").max(100),
});

export const UpdateGroupSchema = yup.object().shape({
    name: yup.string().required("Name is required").max(128),
});

export const UpdateGroupRole = yup.object().shape({
    roles: yup.array().of(yup.string().max(128)),
});

export const UpdateGroupUser = yup.object().shape({
    users: yup.array().of(yup.string().max(128)),
});
