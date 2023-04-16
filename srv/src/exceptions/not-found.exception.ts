import {HttpException, HttpStatus} from '@nestjs/common';
import {BackendError} from './backend-error.class';

export class NotFoundException extends HttpException {
    constructor(message?: string) {
        const error: BackendError = new BackendError();
        error.error = 'resource_not_found';
        error.message = 'Resource not found';
        error.data = {detailMessage: message};
        super(error, HttpStatus.NOT_FOUND);
    }
}
