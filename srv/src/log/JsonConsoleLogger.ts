import {ConsoleLogger, LogLevel} from "@nestjs/common";
import * as os from "node:os";
import * as worker_threads from "node:worker_threads";

export class JsonConsoleLogger extends ConsoleLogger {
    protected formatPid(pid: number): string {
        return `${pid}`;
    }

    protected colorize(message: string, logLevel: LogLevel): string {
        return message;
    }

    protected formatMessage(
        logLevel: LogLevel,
        message: unknown,
        pidMessage: string,
        formattedLogLevel: string,
        contextMessage: string,
        timestampDiff: string,
    ): string {
        return (
            JSON.stringify({
                "@timestamp": new Date().toISOString(),
                "@version": 1,
                level: logLevel,
                message: message instanceof Object ? message : String(message),
                logger_name: contextMessage || undefined,
                thread_name: worker_threads.threadId,
                pid: Number(pidMessage.replace(/\D/g, "")) || undefined,
                host: os.hostname(),
                app: process.env.APP_NAME || "auth-server",
                timestampDiff: timestampDiff || undefined,
            }) + "\n"
        );
    }
}
