import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {SessionService} from '../_services/session.service';
import {Observable} from 'rxjs';
import {AuthDefaultService} from "../_services/auth.default.service";

// const TOKEN_HEADER_KEY = 'Authorization';       // for Spring Boot back-end
const TOKEN_HEADER_KEY = 'Authorization';   // for Node.js Express back-end

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private tokenService: SessionService,
                private authDefaultService: AuthDefaultService) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let authReq = req;

        if (this.tokenService.isTokenExpired()) {
            console.log("signing out as token is null");
            this.authDefaultService.signOut('/home');
        }
        const token = this.tokenService.getToken();
        if (token != null) {
            authReq = req.clone({headers: req.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token)});
        }


        return next.handle(authReq);
    }
}

export const authInterceptorProviders = [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
];
