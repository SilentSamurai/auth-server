import {SetMetadata} from '@nestjs/common';
import {Action} from "./actions.enum";
import {SubjectEnum} from "./subjectEnum";

export class RoleRule {
    action: Action;
    subject: SubjectEnum;

    constructor(action: Action, subject: SubjectEnum) {
        this.action = action;
        this.subject = subject;
    }

    public static can(action: Action, subject: SubjectEnum) {
        return new RoleRule(action, subject);
    }


}

export const Rules = (...rules: RoleRule[]) => SetMetadata('rules', rules);

