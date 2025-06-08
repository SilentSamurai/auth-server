import {Injectable} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {Environment} from '../config/environment.service';
import {JwtSignOptions} from "@nestjs/jwt/dist/interfaces/jwt-module-options.interface";
import {JwtVerifyOptions} from "@nestjs/jwt/dist/interfaces";

@Injectable()
export class JwtServiceHS256 {
    private readonly jwtService: JwtService;

    constructor(private readonly configService: Environment) {
        this.jwtService = new JwtService({
            signOptions: {
                algorithm: 'HS256',
                expiresIn: "1h"
            },
        });
    }

    sign(payload: any, options: JwtSignOptions): string {
        return this.jwtService.sign(payload, options);
    }

    verify(token: string, options: JwtVerifyOptions): any {
        return this.jwtService.verify(token, options);
    }

    decode(token: string): any {
        return this.jwtService.decode(token, {json: true});
    }
}

@Injectable()
export class JwtServiceRS256 {
    private readonly jwtService: JwtService;

    constructor(private readonly configService: Environment) {
        this.jwtService = new JwtService({
            signOptions: {
                algorithm: "RS256",
                expiresIn: configService.get(
                    "TOKEN_EXPIRATION_TIME",
                ),
                issuer: this.configService.get("SUPER_TENANT_DOMAIN")
            },
        });
    }

    async sign(payload: any, options: JwtSignOptions): Promise<string> {
        return this.jwtService.signAsync(payload, options);
    }

    async verify(token: string, options: JwtVerifyOptions): Promise<any> {
        return this.jwtService.verifyAsync(token, options);
    }

    decode(token: string): any {
        return this.jwtService.decode(token, {json: true});
    }
}