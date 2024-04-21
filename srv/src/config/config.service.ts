import {Injectable} from '@nestjs/common';
import {config} from 'dotenv';
import * as path from 'path';
import {join} from 'path';

@Injectable()
export class ConfigService {
    constructor() {
    }

    static config(): any {
        if (!this.isProduction()) {
            let envPath = path.resolve(process.cwd(), '.env.development');
            console.log("Environment path :", envPath);
            config({
                path: envPath
            })

            console.log("Environment variables:");
            Object.keys(process.env).forEach(function (key) {
                console.log(key + '=' + process.env[key]);
            });
        }
    }

    static configTest(print = false): any {
        let envPath = path.resolve(process.cwd(), '.env.testing');
        console.log("Environment path :", envPath);
        config({
            path: envPath
        })


        if (print) {
            console.log("Environment variables:");
            Object.keys(process.env).forEach(function (key) {
                console.log(key + '=' + process.env[key]);
            });
        }
    }

    /**
     * Get a configuration value.
     */
    static get(key: string, defaultValue: any = null): any {
        if (key in process.env) {
            let value: string = process.env[key];
            switch (value) {
                case 'true':
                    return true;
                case 'false':
                    return false;
                default:
                    return value;
            }
        } else {
            if (defaultValue) {
                return defaultValue;
            } else {
                return null;
            }
        }
    }

    /**
     * Get a configuration value.
     */
    get(key: string, defaultValue: any = null): any {
        return ConfigService.get(key, defaultValue);
    }

    /**
     * Get the service name.
     */
    getServiceName(): string {
        const key: string = 'SERVICE_NAME';
        if (key in process.env) {
            return process.env[key];
        } else {
            return 'Auth Server';
        }
    }

    /**
     * Get the static path.
     */
    getStaticPath(): string {
        return join(process.cwd(), process.env.STATIC_PATH);
    }

    /**
     * Is a production environment?
     */
    static isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    isProduction() {
        return ConfigService.isProduction();
    }
}
