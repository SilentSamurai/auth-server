import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Tenant} from '../entity/tenant.entity';
import {TenantBits} from "../entity/tenant-bits.entity";

@Injectable()
export class TenantBitsService {
    constructor(
        @InjectRepository(TenantBits)
        private readonly kvRepository: Repository<TenantBits>,
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
    ) {
    }

    async addOrUpdateKey(tenantId: string, ownerTenantId: string, key: string, value: string): Promise<TenantBits> {
        const tenant = await this.tenantRepository.findOneByOrFail({id: tenantId});
        const ownerTenant = await this.tenantRepository.findOneByOrFail({id: ownerTenantId});
        let kv = await this.kvRepository.findOne({
            where: {
                tenant: {id: tenantId},
                ownerTenant: {id: ownerTenantId},
                key
            }
        });
        if (kv) {
            kv.value = value;
        } else {
            kv = this.kvRepository.create({tenant, ownerTenant, key, value});
        }
        return this.kvRepository.save(kv);
    }

    async deleteKey(tenantId: string, ownerTenantId: string, key: string): Promise<void> {
        await this.kvRepository.delete({tenant: {id: tenantId}, ownerTenant: {id: ownerTenantId}, key});
    }

    async keyExists(tenantId: string, ownerTenantId: string, key: string): Promise<boolean> {
        return !!(await this.kvRepository.findOne({
            where: {
                tenant: {id: tenantId},
                ownerTenant: {id: ownerTenantId},
                key
            }
        }));
    }

    async getKeyValue(tenantId: string, ownerTenantId: string, key: string): Promise<string | null> {
        const kv = await this.kvRepository.findOne({
            where: {
                tenant: {id: tenantId},
                ownerTenant: {id: ownerTenantId},
                key
            }
        });
        return kv ? kv.value : null;
    }
} 