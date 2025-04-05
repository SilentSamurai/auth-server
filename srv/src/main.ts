import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {AppModule} from './app.module';
import {HttpExceptionFilter} from './exceptions/http-exception.filter';
import {Environment} from './config/environment.service';
import * as express from 'express';
import * as fs from 'fs';
import * as process from 'node:process';
import {JsonConsoleLogger} from './log/JsonConsoleLogger';
import {NestApplicationOptions} from "@nestjs/common/interfaces/nest-application-options.interface";
import {createFakeSmtpServer} from "./mail/FakeSmtpServer";

const os = require('os');
const cluster = require('cluster');


async function prepareApp() {

    let options: NestApplicationOptions = {
        httpsOptions: null,
        cors: false
    };

    // https
    if (Environment.get('ENABLE_HTTPS')) {
        const keyPath = Environment.get('KEY_PATH');
        const certPath = Environment.get('CERT_PATH');

        // Protective check before reading files
        if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
            console.error(
                `HTTPS is enabled but missing key/cert. Key Path: ${keyPath}, Cert Path: ${certPath}`
            );
            process.exit(1);
        }
        options.httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        }
    }

    // logger
    if (Environment.isProduction()) {
        options.logger = new JsonConsoleLogger();
    }

    // smtp
    if (!Environment.isProduction()) {
        const server = createFakeSmtpServer({});
        server.listen();
    }

    console.log("Application options: ", options);
    const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(
        AppModule,
        options
    );
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

    return app;
}

async function run(app: NestExpressApplication) {
    // Graceful shutdown: on SIGTERM/SIGINT, close Nest app cleanly
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
        process.on(signal, async () => {
            console.log(`Received ${signal}, closing Nest application...`);
            await app.close();
            console.log('Nest application successfully closed.');
            process.exit(0);
        });
    });

    const port = Environment.get('PORT') || 9000;
    await app.listen(port);

    const url: string = await app.getUrl();
    console.log(`🚀 Service running on: ${url}`);
}

async function main() {
    Environment.setup();

    const numCPUs = Environment.isProduction() ? os.cpus().length : 1;

    console.log(`Detected ${os.cpus().length} CPU cores available.`);
    console.log(`Using ${numCPUs} worker(s) based on isProduction='${Environment.isProduction()}'`);

    if (cluster.isPrimary) {
        console.log(`Primary process(${process.pid}) started. Forking workers...`);

        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(
                `Worker process(${worker.process.pid}) exited with code ${code} and signal ${signal}`
            );
            // Optionally start a new worker if one exits
            // cluster.fork();
        });
    } else {
        // Workers can share any TCP connection
        // In this case, it’s an HTTP server
        const app = await prepareApp();
        await run(app);
        console.log(`Worker process(${process.pid}) started`);
    }
}

main();
