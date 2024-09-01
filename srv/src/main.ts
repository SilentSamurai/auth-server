import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {AppModule} from './app.module';
import {HttpExceptionFilter} from './exceptions/http-exception.filter';
import {ConfigService} from './config/config.service';
import * as express from 'express';
import * as fs from 'fs';

const os = require('os');
const cluster = require('cluster');



async function bootstrap() {
    ConfigService.config();

    let httpsOptions: any = null;
    if (ConfigService.get('ENABLE_HTTPS')) {
        httpsOptions = {};
        httpsOptions['key'] = fs.readFileSync(ConfigService.get('KEY_PATH'));
        httpsOptions['cert'] = fs.readFileSync(ConfigService.get('CERT_PATH'))
    }

    const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(AppModule,
        {
            httpsOptions: httpsOptions
        });
    app.useGlobalFilters(new HttpExceptionFilter());

    if (ConfigService.get('ENABLE_CORS')) {
        app.enableCors();
    }

    app.use(express.json(
        {
            limit: ConfigService.get('MAX_REQUEST_SIZE')
        }));

    app.use(express.urlencoded(
        {
            limit: ConfigService.get('MAX_REQUEST_SIZE'),
            extended: true
        }));


    await app.listen(ConfigService.get('PORT') || 9000);

    const url: string = await app.getUrl();
    console.log(`🚀 Service running on: ${url}`);
}


async function main() {
    const numCPUs = os.cpus().length;
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
