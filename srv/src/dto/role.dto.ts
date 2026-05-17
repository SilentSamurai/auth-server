import * as yup from "yup";
import {OperatingRoleSchema} from "./tenant.dto";

export {OperatingRoleSchema};

export const CreateRoleSchema = yup.object().shape({
    name: yup.string().required("Name is required").max(20),
    tenantId: yup.string().required("TenantId is required"),
});

export const UpdateRoleSchema = yup.object().shape({
    name: yup.string().optional(),
    description: yup.string().optional(),
    appId: yup.string().optional().nullable(),
});
