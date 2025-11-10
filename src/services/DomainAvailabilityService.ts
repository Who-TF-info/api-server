import { promises as dns } from 'node:dns';
import { BaseCacheableService } from '@app/services/core/BaseCacheableService';
import { AppLogger } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import type { Logger } from 'pino';
import { PorkbunApiClient } from 'porkbun-api-client';
import { inject, singleton } from 'tsyringe';

@singleton()
export class DomainAvailabilityService extends BaseCacheableService {
    protected porkbunClient: PorkbunApiClient;

    constructor(
        @inject(AppLogger) logger: Logger,
        @inject(Keyv) cache: Keyv,
        @inject(PorkbunApiClient) porkbunClient: PorkbunApiClient
    ) {
        super(logger.child({ module: 'DomainAvailabilityService' }), cache);
        this.porkbunClient = porkbunClient;
    }

    async check(domain: string) {
        const recordExists = await this.dnsRecordsExist(domain);
        if (recordExists) {
            return false;
        }

        try {
            const { response } = await this.porkbunClient.domain.checkDomain({ domain });
            return response.avail === 'yes';
        } catch (error) {
            this.logger.warn(
                {
                    domain,
                    error: error instanceof Error ? error.message : String(error),
                },
                'PorkBun API check failed, falling back to DNS-only availability check'
            );
            // If PorkBun fails (e.g., missing credentials), fall back to DNS-only check
            // If no DNS records exist, assume domain is available
            return !recordExists;
        }
    }

    protected async dnsRecordsExist(domain: string): Promise<boolean> {
        try {
            // Check for common DNS records that indicate domain is registered
            const checks = await Promise.allSettled([
                this.hasARecord(domain),
                this.hasNSRecord(domain),
                this.hasMXRecord(domain),
                this.hasSOARecord(domain),
            ]);

            // If ANY DNS record exists, domain is likely registered
            return checks.some((result) => result.status === 'fulfilled' && result.value === true);
        } catch (_error) {
            // DNS errors usually mean domain doesn't exist
            return false;
        }
    }

    protected async hasARecord(domain: string): Promise<boolean> {
        try {
            const records = await dns.resolve4(domain);
            return records.length > 0;
        } catch {
            return false;
        }
    }

    protected async hasNSRecord(domain: string): Promise<boolean> {
        try {
            const records = await dns.resolveNs(domain);
            return records.length > 0;
        } catch {
            return false;
        }
    }

    protected async hasMXRecord(domain: string): Promise<boolean> {
        try {
            const records = await dns.resolveMx(domain);
            return records.length > 0;
        } catch {
            return false;
        }
    }

    protected async hasSOARecord(domain: string): Promise<boolean> {
        try {
            const record = await dns.resolveSoa(domain);
            return !!record;
        } catch {
            return false;
        }
    }
}
