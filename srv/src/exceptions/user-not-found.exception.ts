import {HttpException, HttpStatus} from "@nestjs/common";
import {BackendError} from "./backend-error.class";

export class UserNotFoundException extends HttpException {
    constructor(user?: string) {
        const error: BackendError = new BackendError();
        error.error = "user_not_found";
        error.message = "User not found";
        error.data = {user: user};
        super(error, HttpStatus.NOT_FOUND);
    }
}
