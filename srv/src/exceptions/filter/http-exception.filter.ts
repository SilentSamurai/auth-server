import {ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger, Type,} from "@nestjs/common";
import {Request, Response} from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    static exceptionResolver: Map<Type, Function> = new Map<Type, Function>();
    private static readonly LOGGER = new Logger(HttpExceptionFilter.name);

    static {
    }

    // Exception may not be an HttpException.
    catch(exception: Error, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        console.error(exception);

        if (exception instanceof HttpException) {
            const httpException = exception as HttpException;
            let error = httpException.getResponse ? httpException.getResponse() : {};

            error["message"] = httpException.message;
            error["url"] = request.url;
            error["timestamp"] = new Date().toISOString();
            error["status"] = httpException.getStatus();

            response.status(httpException.getStatus()).json(error);
        } else {
            const message: string = (exception as Error)?.message;
            response.status(500).json({
                message: message,
                status: 500,
                timestamp: new Date().toISOString(),
                url: request.url,
            });
        }
    }
}
