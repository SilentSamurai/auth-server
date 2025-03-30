import {Injectable} from "@nestjs/common";
import {Role} from "../entity/role.entity";
import {Environment} from "../config/environment.service";
import {Policy} from "../entity/authorization.entity";
import {AuthContext} from "./contexts";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {NotFoundException} from "../exceptions/not-found.exception";
import {Action, Effect} from "./actions.enum";
import {SecurityService} from "./security.service";
import {SubjectEnum} from "../entity/subjectEnum";


@Injectable()
export class PolicyService {

    constructor(
        private readonly configService: Environment,
        private readonly securityService: SecurityService,
        @InjectRepository(Policy) private authorizationRepository: Repository<Policy>
    ) {
    }

    public async createAuthorization(authContext: AuthContext, role: Role,
                                     effect: Effect,
                                     action: Action,
                                     subject: string,
                                     conditions: any) {

        this.securityService.isAuthorized(authContext, Action.Create, SubjectEnum.POLICY);

        const auth = this.authorizationRepository.create({
            role: role,
            tenant: role.tenant,
            effect: effect,
            action: action,
            subject: subject,
            conditions: conditions,
        });
        return await this.authorizationRepository.save(auth);
    }

    public async findByRole(authContext: AuthContext, role: Role) {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.POLICY, {roleId: role.id});

        return await this.authorizationRepository.find({
            where: {
                role: {
                    id: role.id
                }
            },
            relations: ['role']
        });
    }

    public async findById(authContext: AuthContext, id: string): Promise<Policy> {

        const auth = await this.authorizationRepository.findOne({
            where: {
                id: id,
            },
            relations: ['role']
        });
        if (auth == undefined) {
            throw new NotFoundException("Policy Not Found");
        }

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.POLICY, {roleId: auth.role.id});

        return auth;
    }

    public async updateAuthorization(authContext: AuthContext, id: string, body: {
        effect?: Effect,
        action?: Action,
        subject?: string,
        conditions?: { [string: string]: string } | null,
    }): Promise<any> {
        const auth = await this.findById(authContext, id);

        this.securityService.isAuthorized(authContext, Action.Update, SubjectEnum.POLICY, {roleId: auth.role.id});

        if (body.effect) {
            auth.effect = body.effect;
        }
        if (body.action) {
            auth.action = body.action;
        }
        if (body.subject) {
            auth.subject = body.subject;
        }
        if (body.conditions) {
            auth.conditions = body.conditions;
        }
        await this.authorizationRepository.save(auth);
        return auth;
    }

    public async removeAuthorization(authContext: AuthContext, id: string): Promise<any> {
        const auth = await this.findById(authContext, id);
        this.securityService.isAuthorized(authContext, Action.Update, SubjectEnum.POLICY, {roleId: auth.role.id});
        return await this.authorizationRepository.delete(id);
    }


}