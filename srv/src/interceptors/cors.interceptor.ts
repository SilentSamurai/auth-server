import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { Request, Response } from "express";
import { CorsOriginService } from "../services/cors-origin.service";

@Injectable()
export class CorsInterceptor implements NestInterceptor {
    private readonly logger = new Logger(CorsInterceptor.name);

    constructor(private readonly corsOriginService: CorsOriginService) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const origin = request.headers.origin;
        if (!origin) {
            return next.handle();
        }

        // Authenticated endpoint: check origin against the JWT's client_id
        const securityContext = (request as any)["SECURITY_CONTEXT"];
        if (!securityContext) {
            return next.handle();
        }

        const clientId = securityContext.client_id;
        if (!clientId) {
            return next.handle();
        }

        try {
            const allowed = await this.corsOriginService.isOriginAllowedForClient(origin, clientId);
            if (allowed) {
                response.setHeader("Access-Control-Allow-Origin", origin);
                response.setHeader("Access-Control-Allow-Credentials", "true");
                response.setHeader("Vary", "Origin");
            }
        } catch (error) {
            this.logger.warn(`CORS check failed for client_id=${clientId}, origin=${origin}: ${error.message}`);
        }

        return next.handle();
    }
}
