import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger} from '@nestjs/common';
import {Request, Response} from 'express';
import {BackendError} from './backend-error.class';
import {UnknownErrorException} from './unknown-error.exception';
import {InvalidRequestException} from './invalid-request.exception';
import {ForbiddenException} from './forbidden.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {

    private static readonly LOGGER = new Logger(HttpExceptionFilter.name);

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
                        exception = new InvalidRequestException();
                        break;
                    }
                    case HttpStatus.FORBIDDEN: {
                        exception = new ForbiddenException();
                        break;
                    }
                    default: {
                        const message: string = exception.message;
                        exception = new UnknownErrorException(message);
                        break;
                    }
                }

            }
        } else {
            const message: string = (exception as Error)?.message;
            exception = new UnknownErrorException(message);
            error['message'] = message;
        }

        error['url'] = request.url;
        error['timestamp'] = (new Date()).toISOString();

        response
            .status(exception.getStatus())
            .json(error);
    }
}
