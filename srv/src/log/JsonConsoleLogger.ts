import {ConsoleLogger, LogLevel} from "@nestjs/common";
import * as os from "node:os";
import * as worker_threads from "node:worker_threads";

export class JsonConsoleLogger extends ConsoleLogger {
    protected formatPid(pid: number): string {
        return `${pid}`;
    }

    protected colorize(message: string, logLevel: LogLevel): string {
        return message; // No colorization needed for Logstash
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
                "@timestamp": new Date().toISOString(), // Standardized timestamp
                "@version": 1,
                level: logLevel,
                message: message instanceof Object ? message : String(message),
                logger_name: contextMessage || undefined,
                thread_name: worker_threads.threadId,
                pid: Number(pidMessage.replace(/\D/g, "")) || undefined, // Extract number from pidMessage
                host: os.hostname(), // Automatically capture hostname
                app: "my-nest-app", // Replace with your app name
                timestampDiff: timestampDiff || undefined, // Optional
            }) + "\n"
        );
    }
}
