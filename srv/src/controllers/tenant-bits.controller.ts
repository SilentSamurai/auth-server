import {
    Body,
    Controller,
    Delete,
    Get,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { schemaPipe } from '../validation/validation.pipe';
import * as yup from 'yup';
import { AuthContext } from "../casl/contexts";
import { SecurityService } from '../casl/security.service';
import {TenantBitsService} from "../services/tenant-bits.service";

const TenantBitsAddOrUpdateSchema = yup.object().shape({
    tenantId: yup.string().required('TenantId is required'),
    key: yup.string().required('Key is required').max(128),
    value: yup.string().required('Value is required'),
});

const TenantBitsDeleteSchema = yup.object().shape({
    tenantId: yup.string().required('TenantId is required'),
    key: yup.string().required('Key is required').max(128),
});

const TenantBitsExistsSchema = yup.object().shape({
    tenantId: yup.string().required('TenantId is required'),
    key: yup.string().required('Key is required').max(128),
});

@UseGuards(JwtAuthGuard)
@Controller('/api/tenant-bits')
export class TenantBitsController {
    constructor(
        private readonly bitsService: TenantBitsService,
        private readonly securityService: SecurityService
    ) { }

    @Post()
    async addOrUpdate(
        @Request() req: AuthContext,
        @Body(schemaPipe(TenantBitsAddOrUpdateSchema)) body: { tenantId: string; key: string; value: string }
    ) {
        const technicalToken = this.securityService.getTechnicalToken(req);
        const ownerTenantId = technicalToken.tenant.id;
        const kv = await this.bitsService.addOrUpdateKey(body.tenantId, ownerTenantId, body.key, body.value);
        return { success: true, kv };
    }

    @Delete()
    async delete(
        @Request() req: AuthContext,
        @Body(schemaPipe(TenantBitsDeleteSchema)) body: { tenantId: string; key: string }
    ) {
        const technicalToken = this.securityService.getTechnicalToken(req);
        const ownerTenantId = technicalToken.tenant.id;
        await this.bitsService.deleteKey(body.tenantId, ownerTenantId, body.key);
        return { success: true };
    }

    @Get('/exists')
    async exists(
        @Request() req: AuthContext,
        @Query(schemaPipe(TenantBitsExistsSchema)) query: { tenantId: string; key: string }
    ) {
        const technicalToken = this.securityService.getTechnicalToken(req);
        const ownerTenantId = technicalToken.tenant.id;
        const exists = await this.bitsService.keyExists(query.tenantId, ownerTenantId, query.key);
        return { exists };
    }

    @Get()
    async getValue(
        @Request() req: AuthContext,
        @Query(schemaPipe(TenantBitsExistsSchema)) query: { tenantId: string; key: string }
    ) {
        const technicalToken = this.securityService.getTechnicalToken(req);
        const ownerTenantId = technicalToken.tenant.id;
        const value = await this.bitsService.getKeyValue(query.tenantId, ownerTenantId, query.key);
        return { value };
    }
} 