import net from 'node:net';
import { CacheTTL } from '@app/constants/CacheTTL';
import { BaseCacheableService } from '@app/services/core/BaseCacheableService';
import type { WhoisData } from '@app/types/WhoisData';
import { AppLogger } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';

@singleton()
export class WhoisClient extends BaseCacheableService {
    protected cacheTTL = CacheTTL.WHOIS_RESPONSE;
    protected defaultTimeout = 10000; // 10 seconds

    // Map of known slow servers and their preferred timeouts
    protected slowServers: Record<string, number> = {
        // Examples can be added as needed:
        // 'whois.slowserver.com': 20000, // 20 seconds
    };

    constructor(@inject(AppLogger) logger: Logger, @inject(Keyv) cache: Keyv) {
        super(logger, cache);
    }
    async query(domain: string, whoisServer: string): Promise<WhoisData | null> {
        const cacheKey = `WhoisClient::query::${domain}::${whoisServer}`;
        return this.rememberCache(
            cacheKey,
            async () => {
                const rawResponse = await this.queryWhoisServer(domain, whoisServer);
                return this.normalizeWhoisResponse(rawResponse, domain);
            },
            this.cacheTTL
        );
    }

    protected async queryWhoisServer(domain: string, whoisServer: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.logger.debug(
                {
                    domain,
                    server: whoisServer,
                },
                'connecting to whois server'
            );

            const socket = net.createConnection(43, whoisServer, () => {
                this.logger.debug({ domain, server: whoisServer }, 'whois connection established');
                socket.write(`${domain}\r\n`);
            });

            // Set timeout to prevent hanging connections
            // Use configurable timeout, fallback to default
            const timeout = this.slowServers[whoisServer] ?? this.defaultTimeout;
            socket.setTimeout(timeout);
            this.logger.debug({ whoisServer, timeout }, 'Set socket timeout');

            let data = '';

            socket.on('data', (chunk) => {
                data += chunk.toString();
            });

            socket.on('end', () => {
                this.logger.debug(
                    { domain, server: whoisServer, responseLength: data.length },
                    'whois query completed'
                );
                resolve(data.trim());
            });

            socket.on('timeout', () => {
                this.logger.error({ domain, server: whoisServer }, 'whois query timeout');
                socket.destroy();
                reject(new Error(`WHOIS query timeout for ${domain} on ${whoisServer}`));
            });

            socket.on('error', (error) => {
                const nodeError = error as NodeJS.ErrnoException;

                if (nodeError.code === 'ENOTFOUND') {
                    this.logger.error(
                        {
                            domain,
                            server: whoisServer,
                            error: `DNS resolution failed for WHOIS server: ${whoisServer}`,
                        },
                        'whois server not found'
                    );
                } else {
                    this.logger.error(
                        {
                            domain,
                            server: whoisServer,
                            error: error.message,
                            code: nodeError.code,
                        },
                        'whois connection error'
                    );
                }
                reject(error);
            });

            // Ensure socket is cleaned up in all cases
            socket.on('close', () => {
                this.logger.debug({ domain, server: whoisServer }, 'whois connection closed');
            });
        });
    }
    protected normalizeWhoisResponse(response: string, domain: string): WhoisData {
        const lines = response
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        let registrar: string | undefined;
        let creationDate: Date | undefined;
        let expirationDate: Date | undefined;
        let updatedDate: Date | undefined;
        const nameServers: string[] = [];
        const status: string[] = [];
        let dnssec = false;

        for (const line of lines) {
            // Skip comments and notices
            if (
                line.startsWith('%') ||
                line.startsWith('>>>') ||
                line.startsWith('NOTICE:') ||
                line.startsWith('TERMS OF USE:') ||
                line.startsWith('For more information')
            ) {
                continue;
            }

            // Parse key-value pairs separated by ':'
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const key = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();

            switch (key) {
                case 'registrar':
                    registrar = value;
                    break;

                case 'creation date':
                case 'created':
                    creationDate = new Date(value);
                    break;

                case 'registry expiry date':
                case 'expiry date':
                case 'expires':
                case 'expiration date':
                    expirationDate = new Date(value);
                    break;

                case 'updated date':
                case 'last updated':
                case 'modified':
                    updatedDate = new Date(value);
                    break;

                case 'name server':
                case 'nameserver':
                case 'nserver':
                    if (value && !nameServers.includes(value.toUpperCase())) {
                        nameServers.push(value.toUpperCase());
                    }
                    break;

                case 'domain status':
                case 'status': {
                    // Extract status value, removing URLs and descriptions
                    const statusValue = value.split(' ')[0];
                    if (statusValue && !status.includes(statusValue)) {
                        status.push(statusValue);
                    }
                    break;
                }

                case 'dnssec':
                    dnssec = value.toLowerCase() !== 'unsigned' && value.toLowerCase() !== 'no';
                    break;
            }
        }

        return {
            domain: domain.toLowerCase(),
            registrar,
            creationDate,
            expirationDate,
            updatedDate,
            nameServers,
            status,
            dnssec,
            source: 'whois',
            rawWhois: response,
        };
    }
}
