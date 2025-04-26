import {Injectable} from '@angular/core';
import jwt_decode from 'jwt-decode';
import {DecodedToken} from '../model/user.model';

@Injectable({
    providedIn: 'root',
})
export class TokenVerificationService {
    verifyToken(token: string): boolean {
        try {
            const decodedToken = jwt_decode(token) as DecodedToken;

            if (!this.verifyRequiredFields(decodedToken)) {
                console.error('Invalid token structure');
                return false;
            }

            if (!this.verifyTokenExpiration(decodedToken.exp)) {
                console.error('Token is expired');
                return false;
            }

            if (!this.verifyTokenIssuedTime(decodedToken.iat)) {
                console.error('Token issued in the future');
                return false;
            }

            if (!this.verifyScopes(decodedToken.scopes)) {
                console.error('Invalid scopes in token');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    }

    private verifyRequiredFields(decodedToken: DecodedToken): boolean {
        return !!(
            decodedToken.sub &&
            decodedToken.exp &&
            decodedToken.iat &&
            decodedToken.scopes &&
            decodedToken.email &&
            decodedToken.name &&
            decodedToken.iss
        );
    }

    private verifyTokenExpiration(exp: number): boolean {
        const currentTime = Math.floor(Date.now() / 1000);
        return exp > currentTime;
    }

    private verifyTokenIssuedTime(iat: number): boolean {
        const currentTime = Math.floor(Date.now() / 1000);
        return iat <= currentTime;
    }

    private verifyScopes(scopes: string[]): boolean {
        return Array.isArray(scopes) && scopes.length > 0;
    }
}
