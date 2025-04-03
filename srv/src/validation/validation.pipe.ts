import {ArgumentMetadata, Injectable, Logger, PipeTransform} from '@nestjs/common';
import {ValidationErrorException} from '../exceptions/validation-error.exception';

@Injectable()
export class ValidationPipe implements PipeTransform {

    private readonly logger = new Logger('ValidationPipe');

    constructor(private readonly schema: any) {
    }

    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        try {
            await this.schema.validate(value, {abortEarly: false});
            return value;
        } catch (exception) {
            let message: any = (exception.errors.length === 0) ? 'Validation error' : exception.errors[0];
            this.logger.error(message, exception.stack);
            throw new ValidationErrorException(message);
        }
    }
}
