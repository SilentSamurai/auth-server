import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Logger,
    Param,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {Equal, ILike, In, IsNull, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Not, Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../entity/user.entity";
import {Tenant} from "../entity/tenant.entity";
import {TenantMember} from "../entity/tenant.members.entity";
import {Role} from "../entity/role.entity";
import {NotFoundError} from "rxjs";
import {Action} from "../casl/actions.enum";
import {SecurityService} from "../casl/security.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {escapeRegExp} from "typeorm/util/escapeRegExp";
import {Group} from "../entity/group.entity";
import {FindOperator} from "typeorm/find-options/FindOperator";
import {SubjectEnum} from "../entity/subjectEnum";

const logger = new Logger('GenericSearchController');
const RELATIONS = {
    "Users": {
        "Tenants": "tenants",
        "tenants": "tenants"
    },
    "Tenants": {},
    "TenantMembers": {},
    "Roles": {
        "Users": "users",
        "Tenants": "tenant",
        "tenant": "tenant"
    },
    "Groups": {
        "Tenants": "tenant"
    }
}

class Filter {
    label: string;
    name: string;
    operator: string;
    value: any;
}

class QueryBody {
    pageNo?: number;
    pageSize?: number;
    where?: Filter[];
    expand?: string[];
}


@Controller('api/search')
@UseInterceptors(ClassSerializerInterceptor)
export class GenericSearchController {

    private repos = {};


    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(TenantMember) private memberRepo: Repository<TenantMember>,
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        @InjectRepository(Group) private groupRepository: Repository<Group>,
        private readonly securityService: SecurityService,
    ) {
        this.repos = {
            "Users": usersRepo,
            "Tenants": tenantRepo,
            "TenantMembers": tenantRepo,
            "Roles": roleRepository,
            "Groups": groupRepository
        };
    }

    @Post('/:entity')
    @UseGuards(JwtAuthGuard)
    async search(
        @Request() request,
        @Param('entity') entity: string,
        @Body() query: QueryBody
    ): Promise<any> {

        const repo = this.getRepo(entity);
        if (!repo) {
            throw new NotFoundError(`Resource ${entity} not found`);
        }

        this.securityService.isAuthorized(request, Action.Read, SubjectEnum.getSubject(entity));

        let pageNo = query.pageNo || 0;
        let pageSize = query.pageSize || 30;
        let findOption: any = {
            skip: pageNo * pageSize,
            take: pageSize,
            where: getWhere(entity, query.where),
            relations: this.getRelations(entity, query)
        };
        let users = await repo.find(findOption)
        return {
            pageNo: pageNo,
            pageSize: pageSize,
            data: users
        };
    }

    getRelations(entity: string, query: QueryBody) {
        let relations = RELATIONS[entity] || {};
        let rel_qry = {}
        let expands = query.expand || [];
        for (let related_entity of expands) {
            if (relations.hasOwnProperty(related_entity)) {
                const table_entity = relations[related_entity]
                rel_qry[table_entity] = true;
            }
        }
        return rel_qry;
    }

    getRepo(entity: string) {
        if (this.repos.hasOwnProperty(entity)) {
            return this.repos[entity];
        }
        return null;
    }
}

enum FilterRule {
    EQUALS = 'equals',
    NOT_EQUALS = 'notEquals',
    GREATER_THAN = 'greaterThan',
    GREATER_THAN_OR_EQUALS = 'greaterThanEqual',
    LESS_THAN = 'lessThan',
    LESS_THAN_OR_EQUALS = 'lessThanEquals',
    LIKE = 'contains',
    NOT_LIKE = 'nlike',
    IN = 'in',
    NOT_IN = 'nin',
    IS_NULL = 'isnull',
    IS_NOT_NULL = 'isnotnull',
    REGEX = "regex"
}

export const getCondition = (operator: string, value: any): FindOperator<any> => {
    if (operator == FilterRule.IS_NULL) {
        return IsNull();
    }
    if (operator == FilterRule.IS_NOT_NULL) {
        return Not(IsNull());
    }
    if (operator == FilterRule.EQUALS) {
        return Equal(value);
    }
    if (operator == FilterRule.NOT_EQUALS) {
        return Not(value);
    }
    if (operator == FilterRule.GREATER_THAN) {
        return MoreThan(value);
    }
    if (operator == FilterRule.GREATER_THAN_OR_EQUALS) {
        return MoreThanOrEqual(value);
    }
    if (operator == FilterRule.GREATER_THAN_OR_EQUALS) {
        return MoreThanOrEqual(value);
    }
    if (operator == FilterRule.LESS_THAN) {
        return LessThan(value);
    }
    if (operator == FilterRule.LESS_THAN_OR_EQUALS) {
        return LessThanOrEqual(value);
    }
    if (operator == FilterRule.LIKE) {
        return ILike(`%${value}%`);
    }
    if (operator == FilterRule.NOT_LIKE) {
        return Not(ILike(`%${value}%`));
    }
    if (operator == FilterRule.IN) {
        return In(value.split(','));
    }
    if (operator == FilterRule.NOT_IN) {
        return Not(In(value.split(',')));
    }
    if (operator == FilterRule.REGEX) {
        let newValue = value.replace(new RegExp(escapeRegExp("*"), 'g'), "%");
        return ILike(newValue);
    }
}

export const getWhere = (entity: string, filters: Filter[]) => {
    if (!filters || filters.length < 0) return {};

    let where: any = {};

    for (let filter of filters) {
        if (filter.name.includes("/")) {
            let names = filter.name.split("/");
            names = names.filter((n: string | any[]) => n.length > 0);
            if (names.length != 2) {
                logger.log("Invalid filter: ", filter);
                continue;
            }
            let fk_entity = names[0];
            let fk_entity_field = names[1];
            let relations = RELATIONS[entity] || {};
            if (relations.hasOwnProperty(fk_entity)) {
                fk_entity = relations[fk_entity];
            }
            where[fk_entity] = {};
            where[fk_entity][fk_entity_field] = getCondition(filter.operator, filter.value);
        } else {
            where[filter.name] = getCondition(filter.operator, filter.value);
        }
    }
    logger.log("Query formed Where: ", where);
    return where;
}

