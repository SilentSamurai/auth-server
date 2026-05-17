import * as yup from "yup";
import {Action, Effect} from "../casl/actions.enum";

export const CreatePolicySchema = yup.object().shape({
    role: yup.string().uuid().required("role is required"),
    effect: yup
        .mixed<Effect>()
        .required("effect is required")
        .oneOf(Object.values(Effect)),
    action: yup
        .mixed<Action>()
        .required("action is required")
        .oneOf(Object.values(Action)),
    subject: yup.string().required("subject is required"),
    conditions: yup.object(),
});

export const UpdatePolicySchema = yup.object().shape({
    effect: yup.mixed<Effect>().oneOf(Object.values(Effect)),
    action: yup.mixed<Action>().oneOf(Object.values(Action)),
    subject: yup.string(),
    conditions: yup.object(),
});
