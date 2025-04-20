
import {prepareApp, run} from "./setup";

const os = require('os');
const cluster = require('cluster');



// async function main_muti_process() {
//     Environment.setup();
//
//     const numCPUs = Environment.isProduction() ? os.cpus().length : 1;
//
//     console.log(`Detected ${os.cpus().length} CPU cores available.`);
//     console.log(`Using ${numCPUs} worker(s) based on isProduction='${Environment.isProduction()}'`);
//
//     if (cluster.isPrimary) {
//         console.log(`Primary process(${process.pid}) started. Forking workers...`);
//
//         for (let i = 0; i < numCPUs; i++) {
//             cluster.fork();
//         }
//
//         cluster.on('exit', (worker, code, signal) => {
//             console.log(
//                 `Worker process(${worker.process.pid}) exited with code ${code} and signal ${signal}`
//             );
//             // Optionally start a new worker if one exits
//             // cluster.fork();
//         });
//     } else {
//         // Workers can share any TCP connection
//         // In this case, it’s an HTTP server
//         const app = await prepareApp();
//         await run(app);
//         console.log(`Worker process(${process.pid}) started`);
//     }
// }

async function main() {

    const app = await prepareApp();
    await run(app);
}

main().catch(console.error);
