import {SetMetadata} from "@nestjs/common";
import {Action} from "./actions.enum";
import {SubjectEnum} from "../entity/subjectEnum";

export class RoleRule {
    action: Action;
    subject: string;

    constructor(action: Action, subject: string) {
        this.action = action;
        this.subject = subject;
    }

    public static can(action: Action, subject: string) {
        return new RoleRule(action, subject);
    }
}

export const Rules = (...rules: RoleRule[]) => SetMetadata("rules", rules);
