import {Injectable, Logger, OnModuleDestroy, OnModuleInit,} from "@nestjs/common";
import * as NodeCache from "node-cache";

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private logger = new Logger("CacheService");

    private cache: NodeCache;

    constructor() {
        this.cache = new NodeCache({
            stdTTL: 100,
            checkperiod: 20,
            maxKeys: 100,
        });
    }

    onModuleInit() {
        // this.logger.log('Cache Service Initialized');
    }

    onModuleDestroy() {
        // this.logger.log('Flushing cache before shutdown');
        this.cache.flushAll();
    }

    // Set cache with optional TTL (time-to-live in seconds)
    set<T>(key: string, value: T, ttl?: number): boolean {
        return this.cache.set(key, value, ttl);
    }

    // Get cache
    get<T>(key: string): T | undefined {
        return this.cache.get(key);
    }

    // Delete a specific key
    del(key: string): void {
        this.cache.del(key);
    }

    // Check if key exists
    has(key: string): boolean {
        return this.cache.has(key);
    }

    // Clear all cache
    flush(): void {
        this.cache.flushAll();
    }
}
