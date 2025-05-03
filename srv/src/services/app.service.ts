import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {App} from '../entity/app.entity';
import {TenantService} from "./tenant.service";
import {AuthContext} from "../casl/contexts";

@Injectable()
export class AppService {
    constructor(
        @InjectRepository(App)
        private readonly appRepository: Repository<App>,
        private readonly tenantService: TenantService
    ) {
    }

    /**
     * Creates a new application owned by the specified tenant.
     */
    async createApp(authContext: AuthContext, tenantId: string, name: string, appUrl: string, description?: string): Promise<App> {
        const tenant = await this.tenantService.findById(authContext, tenantId);
        const newApp = this.appRepository.create({
            name,
            description,
            appUrl: appUrl,
            owner: tenant
        });
        return this.appRepository.save(newApp);
    }

    /**
     * Retrieves an app by its ID.
     */
    async getAppById(appId: string): Promise<App> {
        return this.appRepository.findOneOrFail({where: {id: appId}, relations: ['owner']});
    }

    /**
     * Retrieves a tenant by its ID.
     */
    async findByTenantId(tenantId: string): Promise<App[]> {
        return this.appRepository.findBy({owner: {id: tenantId}});
    }
}