import {Injectable, Logger} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Client} from "../entity/client.entity";

@Injectable()
export class CorsOriginService {
    private readonly logger = new Logger(CorsOriginService.name);

    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
    ) {
    }

    /**
     * Extract origin (scheme + host + port if non-default) from a URI.
     * Returns null for malformed URIs.
     */
    static extractOrigin(uri: string): string | null {
        try {
            const url = new URL(uri);
            return url.origin;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if a given origin is allowed for a specific client.
     * Queries the database directly — no caching.
     */
    async isOriginAllowedForClient(origin: string, clientId: string): Promise<boolean> {
        const client = await this.clientRepository.findOne({
            where: { clientId },
            select: ["redirectUris"],
        });
        if (!client || !client.redirectUris) {
            return false;
        }

        for (const uri of client.redirectUris) {
            const allowedOrigin = CorsOriginService.extractOrigin(uri);
            if (allowedOrigin === origin) {
                return true;
            }
        }

        return false;
    }
}
