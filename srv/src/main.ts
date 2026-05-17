import {prepareApp, run} from "./setup";

async function main() {
    const app = await prepareApp();
    await run(app);
}

main().catch(console.error);
