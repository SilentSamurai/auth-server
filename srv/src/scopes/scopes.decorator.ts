import {SetMetadata} from '@nestjs/common';
import {Action} from "./actions.enum";
import {SubjectEnum} from "./subjectEnum";

export class ScopeRule {
    action: Action;
    subject: SubjectEnum;

    constructor(action: Action, subject: SubjectEnum) {
        this.action = action;
        this.subject = subject;
    }

    public static can(action: Action, subject: SubjectEnum) {
        return new ScopeRule(action, subject);
    }


}

export const Rules = (...rules: ScopeRule[]) => SetMetadata('rules', rules);

