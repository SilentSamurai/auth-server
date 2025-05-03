import * as http from 'http';

/**
 * Interface for environment configuration
 */
interface ServerConfig {
    port?: number;
    host?: string;
    logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Interface for the response from app's onboard endpoint
 */
interface OnboardResponse {
    appNames?: string[];
}

/**
 * Interface for the response from app's offboard endpoint
 */
interface OffboardResponse {
    appNames?: string[];
}

export class MockOnboardServer {
    private server: http.Server;
    private config: Required<ServerConfig>;
    private logger: Console;

    constructor(config: ServerConfig = {}) {
        this.config = this.getFullConfig(config);
        this.logger = console;

        // Create server
        this.server = http.createServer(this.handleRequest.bind(this));

        // Setup graceful shutdown
        this.setupShutdownHandlers();
    }

    /**
     * Start the server
     */
    public async listen(): Promise<MockOnboardServer> {
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, this.config.host, () => {
                this.log('info', `Mock Onboard Server listening on ${this.config.host}:${this.config.port}`);
                resolve(this);
            });
        });
    }

    /**
     * Close the server
     */
    public async close(): Promise<void> {
        this.log('info', 'Closing Mock Onboard Server...');
        return new Promise((resolve, reject) => {
            this.server.close((error?: Error) => {
                if (error) {
                    this.log('error', 'Error closing Mock Onboard Server:', error);
                    return reject(error);
                }
                this.log('info', 'Mock Onboard Server closed');
                resolve();
            });
        });
    }

    /**
     * Handle incoming requests
     */
    private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Handle onboard endpoint
        if (req.url?.startsWith('/onboard/tenant/') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    this.log('info', `Received onboard request for tenant: ${data.tenantId}`);

                    // Return a successful response with no additional apps
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({appNames: []} as OnboardResponse));
                } catch (error) {
                    this.log('error', 'Error parsing request body:', error);
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: 'Invalid request body'}));
                }
            });
        }
        // Handle offboard endpoint
        else if (req.url?.startsWith('/offboard/tenant/') && req.method === 'POST') {
            const tenantId = req.url.split('/').pop();
            this.log('info', `Received offboard request for tenant: ${tenantId}`);

            // Return a successful response with no additional apps
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({appNames: []} as OffboardResponse));
        }
        // Handle unknown endpoints
        else {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Not found'}));
        }
    }

    /**
     * Merge provided config with defaults
     */
    private getFullConfig(config: ServerConfig): Required<ServerConfig> {
        return {
            port: config.port || 3000,
            host: config.host || 'localhost',
            logLevel: config.logLevel || 'info'
        };
    }

    /**
     * Setup shutdown handlers
     */
    private setupShutdownHandlers(): void {
        // Handle termination signals
        process.on('SIGTERM', async () => {
            this.log('info', 'Mock Onboard Server shutting down (SIGTERM)...');
            await this.close();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            this.log('info', 'Mock Onboard Server shutting down (SIGINT)...');
            await this.close();
            process.exit(0);
        });
    }

    /**
     * Log with appropriate level
     */
    private log(level: 'none' | 'error' | 'warn' | 'info' | 'debug', ...args: any[]): void {
        const levels = {none: 0, error: 1, warn: 2, info: 3, debug: 4};
        if (levels[level] <= levels[this.config.logLevel]) {
            console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'info' ? 'info' : 'log'](...args);
        }
    }
}

/**
 * Create a new MockOnboardServer instance
 */
export const createMockOnboardServer = (config: ServerConfig = {}): MockOnboardServer => {
    return new MockOnboardServer(config);
};

// Auto-start server if this file is executed directly
if (require.main === module) {
    const server = createMockOnboardServer({});
    server.listen().catch(err => console.log(err));
} 