import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {AppModule} from './app.module';
import {HttpExceptionFilter} from './exceptions/http-exception.filter';
import {Environment} from './config/environment.service';
import * as express from 'express';
import * as fs from 'fs';
import * as process from "node:process";
import {JsonConsoleLogger} from "./JsonConsoleLogger";

const os = require('os');
const cluster = require('cluster');



async function bootstrap() {
    Environment.setup();

    let httpsOptions: any = null;
    if (Environment.get('ENABLE_HTTPS')) {
        httpsOptions = {};
        httpsOptions['key'] = fs.readFileSync(Environment.get('KEY_PATH'));
        httpsOptions['cert'] = fs.readFileSync(Environment.get('CERT_PATH'))
    }

    let options: any = {
        httpsOptions: httpsOptions,
    };

    if (Environment.isProduction()) {
        options['logger'] = new JsonConsoleLogger();
    }

    const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(AppModule, options);
    app.useGlobalFilters(new HttpExceptionFilter());

    if (Environment.get('ENABLE_CORS')) {
        app.enableCors();
    }

    app.use(express.json(
        {
            limit: Environment.get('MAX_REQUEST_SIZE')
        }));

    app.use(express.urlencoded(
        {
            limit: Environment.get('MAX_REQUEST_SIZE'),
            extended: true
        }));


    await app.listen(Environment.get('PORT') || 9000);

    const url: string = await app.getUrl();
    console.log(`🚀 Service running on: ${url}`);
}


async function main() {
    const envCores = process.env['USE_CORES'];
    const numCPUs = envCores == "-1" ? os.cpus().length:  1;

    console.log(`${numCPUs} vCpu cores found`);
    if (cluster.isPrimary) {
        console.log(`Primary process(${process.pid}) started`);
        // start 1 process per cpu core using fork
        for (let i = 0; i < numCPUs; i++) {
            const worker = cluster.fork();
        }
        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker process(${worker.process.pid}) exited with code ${code} and ${signal}`);
        });
    } else {
        // Workers can share any TCP connection
        // In this case it is an HTTP server
        bootstrap()

        console.log(`Worker process(${process.pid}) started`);
    }
}

main();
