import {Body, Controller, Param, ParseUUIDPipe, Post, Request, UseGuards} from '@nestjs/common';

import {SubscriptionService} from '../services/subscription.service';
import {AppService} from "../services/app.service";
import {TenantService} from "../services/tenant.service";
import {AuthContext} from "../casl/contexts";
import {schemaPipe} from "../validation/validation.pipe";
import * as yup from "yup";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@Controller('/api/apps')
export class AppController {
    constructor(
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

    @Post('/:appId/subscribe')
    @UseGuards(JwtAuthGuard)
    async subscribeToApp(
        @Request() request: AuthContext,
        @Param('appId', ParseUUIDPipe) appId: string,
        @Body('tenantId', ParseUUIDPipe) tenantId: string
    ) {
        // Retrieve the subscriber tenant & the app, then subscribe
        return this.subscriptionService.subscribeApp(
            await this.tenantService.findById(request, tenantId),
            await this.appService.getAppById(appId)
        );
    }
}