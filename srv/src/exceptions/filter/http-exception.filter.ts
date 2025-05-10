import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    Type,
} from "@nestjs/common";
import {Request, Response} from "express";
import {BackendError} from "../backend-error.class";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    static exceptionResolver: Map<Type, Function> = new Map<Type, Function>();
    private static readonly LOGGER = new Logger(HttpExceptionFilter.name);

    static {
    }

    // Exception may not be an HttpException.
    catch(exception: HttpException, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        let error = exception.getResponse ? exception.getResponse() : {};
        console.error(exception);
        // Throwed http exception.
        if (exception instanceof HttpException) {
            // Throwed unknown http exception.
            if (!(error instanceof BackendError)) {
                const status = exception.getStatus();
                switch (status) {
                    case HttpStatus.NOT_FOUND: {
                        exception = new NotFoundException();
                        break;
                    }
                    case HttpStatus.FORBIDDEN: {
                        exception = new ForbiddenException();
                        break;
                    }
                    case HttpStatus.BAD_REQUEST: {
                        exception = new BadRequestException();
                        break;
                    }
                    default: {
                        const message: string = exception.message;
                        exception = new InternalServerErrorException(message);
                        break;
                    }
                }
            }
        } else {
            const message: string = (exception as Error)?.message;
            exception = new InternalServerErrorException(message);
            error["message"] = message;
        }

        error["url"] = request.url;
        error["timestamp"] = new Date().toISOString();

        response.status(exception.getStatus()).json(error);
    }
}
