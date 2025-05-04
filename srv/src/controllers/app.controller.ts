import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {SubscriptionService} from '../services/subscription.service';
import {AppService} from "../services/app.service";
import {TenantService} from "../services/tenant.service";
import {AuthContext} from "../casl/contexts";
import {schemaPipe} from "../validation/validation.pipe";
import * as yup from "yup";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {SecurityService} from "../casl/security.service";

@Controller('/api/apps')
@UseInterceptors(ClassSerializerInterceptor)
export class AppController {
    constructor(
        private readonly securityService: SecurityService,
        private readonly tenantService: TenantService,
        private readonly appService: AppService,
        private readonly subscriptionService: SubscriptionService
    ) {
    }

    @Post("/create")
    @UseGuards(JwtAuthGuard)
    async createApp(
        @Request() request: AuthContext,
        @Body('tenantId', ParseUUIDPipe) tenantId: string,
        @Body('name', schemaPipe(yup.string().required('name is required').max(128))) name: string,
        @Body('appUrl', schemaPipe(yup.string().required('app url is required').max(2048))) appUrl: string,
        @Body('description', schemaPipe(yup.string().max(128))) description: string
    ) {
        // Here you fetch the tenant, then create a new app referencing the tenant
        const app = await this.appService.createApp(request, tenantId, name, appUrl, description);
        return app;
    }

    /**
     * Update an app by its ID
     */
    @Patch('/:appId')
    @UseGuards(JwtAuthGuard)
    async updateApp(
        @Request() request: AuthContext,
        @Param('appId', ParseUUIDPipe) appId: string,
        @Body('name', schemaPipe(yup.string().required('name is required').max(128))) name: string,
        @Body('appUrl', schemaPipe(yup.string().required('app url is required').max(2048))) appUrl: string,
        @Body('description', schemaPipe(yup.string().max(128))) description: string
    ) {
        const app = await this.appService.updateApp(request, appId, name, appUrl, description);
        return app;
    }

    /**
     * Delete an app by its ID
     */
    @Delete('/:appId')
    @UseGuards(JwtAuthGuard)
    async deleteApp(
        @Request() request: AuthContext,
        @Param('appId', ParseUUIDPipe) appId: string
    ) {
        await this.appService.deleteApp(request, appId);
        return {status: 'success'};
    }

    @Post('/:appId/subscribe/:tenantId')
    @UseGuards(JwtAuthGuard)
    async subscribeToApp(
        @Request() request: AuthContext,
        @Param('appId', ParseUUIDPipe) appId: string,
        @Param('tenantId', ParseUUIDPipe) tenantId: string
    ) {
        // Retrieve the subscriber tenant & the app, then subscribe
        return this.subscriptionService.subscribeApp(
            await this.tenantService.findById(request, tenantId),
            await this.appService.getAppById(appId)
        );
    }

    @Post('/:appId/unsubscribe/:tenantId')
    @UseGuards(JwtAuthGuard)
    async unsubscribeFromApp(
        @Request() request: AuthContext,
        @Param('appId', ParseUUIDPipe) appId: string,
        @Param('tenantId', ParseUUIDPipe) tenantId: string
    ) {
        // Retrieve the subscriber tenant & the app, then unsubscribe
        return this.subscriptionService.unsubscribe(
            await this.tenantService.findById(request, tenantId),
            await this.appService.getAppById(appId)
        );
    }

    @Get('/subscriptions/:appId')
    @UseGuards(JwtAuthGuard)
    async getAllSubscriptions(
        @Param('appId', ParseUUIDPipe) appId: string
    ) {
        return this.subscriptionService.findAllByAppId(appId);
    }

    /**
     * get all app the tenant has subscription to
     */
    @Get('/subscribed-by/:tenantId')
    @UseGuards(JwtAuthGuard)
    async getTenantSubscriptions(
        @Request() request: AuthContext,
        @Param('tenantId', ParseUUIDPipe) tenantId: string
    ) {
        return this.subscriptionService.findByTenantId(tenantId);
    }

    /**
     * Get all apps created by a tenant
     */
    @Get('/created-by/:tenantId')
    @UseGuards(JwtAuthGuard)
    async getAppsCreatedByTenant(
        @Request() request: AuthContext,
        @Param('tenantId', ParseUUIDPipe) tenantId: string
    ) {
        return this.appService.findByTenantId(tenantId);
    }

    /**
     * Get all apps available for subscription
     */
    @Get('/available-for/:tenantId')
    @UseGuards(JwtAuthGuard)
    async getAllSubscribableApps(
        @Request() request: AuthContext,
        @Param('tenantId', ParseUUIDPipe) tenantId: string
    ) {
        const allApps = await this.appService.findAllApps(tenantId);
        return allApps;
    }


}
