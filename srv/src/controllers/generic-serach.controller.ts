import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Param,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {ILike, In, IsNull, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Not, Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../users/user.entity";
import {Tenant} from "../tenants/tenant.entity";
import {TenantMember} from "../tenants/tenant.members.entity";
import {Role} from "../scopes/role.entity";
import {NotFoundError} from "rxjs";
import {Action} from "../scopes/actions.enum";
import {subject} from "@casl/ability";
import {SecurityService} from "../scopes/security.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {escapeRegExp} from "typeorm/util/escapeRegExp";

@Controller('api/search')
@UseInterceptors(ClassSerializerInterceptor)
export class GenericSearchController {

    private repos = {};

    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(TenantMember) private memberRepo: Repository<TenantMember>,
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        private readonly securityService: SecurityService,
    ) {
        this.repos = {
            "Users": usersRepo,
            "Tenants": tenantRepo,
            "TenantMembers": tenantRepo,
            "Roles": roleRepository
        };
    }

    @Post('/:entity')
    @UseGuards(JwtAuthGuard)
    async search(
        @Request() request,
        @Param('entity') entity: string,
        @Body() query: any
    ): Promise<any> {

        const repo = this.getRepo(entity);
        if (!repo) {
            throw new NotFoundError(`Resource ${entity} not found`);
        }

        this.securityService.check(request, Action.Read, subject(entity, {}));

        let pageNo = query.pageNo || 0;
        let pageSize = query.pageSize || 10;
        let findOption: any = {
            skip: pageNo * pageSize,
            take: pageSize,
            where: getWhere(query.where)
        };
        let users = await repo.find(findOption)
        return {
            pageNo: pageNo,
            pageSize: pageSize,
            data: users
        };
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


export const getWhere = (filters: any) => {
    if (!filters || filters.length < 0) return {};

    let where: any = {};

    for (let filter of filters) {
        if (filter.operator == FilterRule.IS_NULL) {
            where[filter.name] = IsNull();
        }
        if (filter.operator == FilterRule.IS_NOT_NULL) {
            where[filter.name] = Not(IsNull());
        }
        if (filter.operator == FilterRule.EQUALS) {
            where[filter.name] = filter.value;
        }
        if (filter.operator == FilterRule.NOT_EQUALS) {
            where[filter.name] = Not(filter.value);
        }
        if (filter.operator == FilterRule.GREATER_THAN) {
            where[filter.name] = MoreThan(filter.value);
        }
        if (filter.operator == FilterRule.GREATER_THAN_OR_EQUALS) {
            where[filter.name] = MoreThanOrEqual(filter.value);
        }
        if (filter.operator == FilterRule.GREATER_THAN_OR_EQUALS) {
            where[filter.name] = MoreThanOrEqual(filter.value);
        }
        if (filter.operator == FilterRule.LESS_THAN) {
            where[filter.name] = LessThan(filter.value);
        }
        if (filter.operator == FilterRule.LESS_THAN_OR_EQUALS) {
            where[filter.name] = LessThanOrEqual(filter.value);
        }
        if (filter.operator == FilterRule.LIKE) {
            where[filter.name] = ILike(`%${filter.value}%`);
        }
        if (filter.operator == FilterRule.NOT_LIKE) {
            where[filter.name] = Not(ILike(`%${filter.value}%`));
        }
        if (filter.operator == FilterRule.IN) {
            where[filter.name] = In(filter.value.split(','));
        }
        if (filter.operator == FilterRule.NOT_IN) {
            where[filter.name] = Not(In(filter.value.split(',')));
        }
        if (filter.operator == FilterRule.REGEX) {
            let newValue = filter.value.replace(new RegExp(escapeRegExp("*"), 'g'), "%");
            where[filter.name] = ILike(newValue);
        }
    }
    return where;
}