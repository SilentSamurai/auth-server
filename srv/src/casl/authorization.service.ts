import {Injectable} from "@nestjs/common";
import {Role} from "../entity/role.entity";
import {Environment} from "../config/environment.service";
import {Authorization} from "../entity/authorization.entity";
import {AuthContext} from "./contexts";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";


@Injectable()
export class AuthorizationService {

    constructor(
        private readonly configService: Environment,
        @InjectRepository(Authorization) private authorizationRepository: Repository<Authorization>
    ) {
    }

    public async createAuthorization(authContext: AuthContext, role: Role, action: string, subject: string, conditions: any) {
        const auth = this.authorizationRepository.create({
            role: role,
            tenant: role.tenant,
            effect: "ALLOW",
            action: action,
            resource: subject,
            conditions: conditions,
        });
        await this.authorizationRepository.save(auth);
    }

    public async getAuthorizations(authContext: AuthContext, role: Role) {
        return await this.authorizationRepository.findBy({role: role});
    }

    public async findById(authContext: AuthContext, id: string): Promise<Authorization> {
        return await this.authorizationRepository.findOneBy({id: id});
    }


    public async updateAuthorization(authContext: AuthContext, id: string, effect: string, action: string, resource: string, conditions: any): Promise<any> {
        const auth = await this.findById(authContext, id);
        auth.effect = effect;
        auth.action = action;
        auth.resource = resource;
        auth.conditions = conditions;
        await this.authorizationRepository.save(auth);
        return auth;
    }

    public async removeAuthorization(authContext: AuthContext, id: string): Promise<any> {
        return await this.authorizationRepository.delete(id);
    }


}