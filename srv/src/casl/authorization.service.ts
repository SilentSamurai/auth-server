import {Injectable} from "@nestjs/common";
import {Role} from "../entity/role.entity";
import {Environment} from "../config/environment.service";
import {Model} from "mongoose";
import {Authorization} from "../entity/authorization.schema";
import {InjectModel} from "@nestjs/mongoose";
import {AuthContext} from "./contexts";


@Injectable()
export class AuthorizationService {

    constructor(
        private readonly configService: Environment,
        @InjectModel(Authorization.name) private authorizationModel: Model<Authorization>
    ) {
    }

    public async createAuthorization(authContext: AuthContext, role: Role, action: string, subject: string, conditions: any) {
        const auth = new this.authorizationModel({
            role_id: role.id,
            role_name: role.name,
            tenant_id: role.tenant.id,
            tenant_domain: role.tenant.domain,
            action: action,
            subject: subject,
            conditions: conditions,
        })
        await auth.save();
    }

    public async getAuthorizations(authContext: AuthContext, role: Role) {
        return await this.authorizationModel.find({
            role_id: role.id,
        }).exec();
    }

    public async findById(authContext: AuthContext, id: string): Promise<Authorization> {
        return await this.authorizationModel.findById(id).exec();
    }


    public async updateAuthorization(authContext: AuthContext, id: string, action: string, subject: string, conditions: any): Promise<any> {
        return await this.authorizationModel.updateOne(
            {_id: id},
            {
                action: action,
                subject: subject,
                conditions: conditions,
            }
        ).exec()
    }

    public async removeAuthorization(authContext: AuthContext, id: string): Promise<any> {
        return await this.authorizationModel.findOneAndDelete(
            {_id: id},
        ).exec()
    }


}