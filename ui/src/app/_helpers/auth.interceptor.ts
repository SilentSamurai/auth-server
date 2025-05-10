import {
    HTTP_INTERCEPTORS,
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError, Observable, throwError} from 'rxjs';
import {SessionService} from '../_services/session.service';
import {AuthDefaultService} from '../_services/auth.default.service';

const TOKEN_HEADER_KEY = 'Authorization'; // for Node.js Express back-end

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private tokenService: SessionService,
        private authDefaultService: AuthDefaultService,
    ) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let authReq = req;

        // 1. Check if token is expired before sending the request
        if (this.tokenService.getToken() != null && this.tokenService.isTokenExpired()) {
            console.warn('Signing out: Token is expired.');
            this.authDefaultService.signOut('/home', true);
            // We still return the request so the app doesn't freeze
            return throwError(() => new Error('Token expired'));
        }

        // 2. Add Authorization header if token is present
        const token = this.tokenService.getToken();
        if (token) {
            authReq = req.clone({
                headers: req.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token),
            });
        }

        // 3. Handle 403 response errors
        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    console.warn('Signing out: Received 403 Forbidden.');
                    this.authDefaultService.signOut('/home', true);
                }
                return throwError(() => error);
            })
        );
    }
}

export const authInterceptorProviders = [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
];
