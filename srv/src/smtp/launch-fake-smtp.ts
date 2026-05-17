import {spawn} from "child_process";
import {join} from "path";

export interface SmtpServerHandle {
    close(): Promise<void>;
}

export function launchFakeSmtpServer(): Promise<SmtpServerHandle> {
    const scriptPath = join(process.cwd(), "tests", "smtp", "FakeSmtpServer.ts");
    const child = spawn("npx", ["ts-node", scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {...process.env},
        shell: true,
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    return new Promise<SmtpServerHandle>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Fake SMTP server startup timed out"));
        }, 15000);

        child.stdout.on("data", (data) => {
            if (data.toString().includes("FAKE_SMTP_READY")) {
                clearTimeout(timeout);
                resolve({
                    close: () =>
                        new Promise<void>((resolveClose) => {
                            child.kill();
                            resolveClose();
                        }),
                });
            }
        });

        child.on("error", (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        child.on("exit", (code) => {
            clearTimeout(timeout);
            reject(new Error(`Fake SMTP server exited with code ${code} before ready`));
        });
    });
}
