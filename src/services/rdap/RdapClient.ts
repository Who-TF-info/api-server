import { BaseCacheableService } from '@app/services/core/BaseCacheableService';
import type { ContactInfo, RdapResponse, VCardArray, WhoisData } from '@app/types/WhoisData';
import { AppLogger } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';

@singleton()
export class RdapClient extends BaseCacheableService {
    protected cacheTTL = 60 * 5 * 1000; // 5 minutes

    constructor(@inject(AppLogger) logger: Logger, @inject(Keyv) cache: Keyv) {
        super(logger, cache);
    }

    async query(domain: string, rdapServer: string): Promise<WhoisData | null> {
        const url = `${rdapServer.replace(/\/$/, '')}/domain/${domain}`;
        const cacheKey = `RdapClient::query::${domain}::${rdapServer}`;
        return this.rememberCache(
            cacheKey,
            async () => {
                this.logger.debug(
                    {
                        domain,
                        server: rdapServer,
                        url,
                    },
                    'fetching rdap server data'
                );

                const res = await fetch(url);

                if (!res.ok) {
                    const errMsg = `RDAP failed: ${res.statusText}`;
                    this.logger.error(
                        {
                            status: res.status,
                            statusText: res.statusText,
                        },
                        errMsg
                    );
                    if (res.status === 404) {
                        return null;
                    }
                    throw new Error(errMsg);
                }

                const result = (await res.json()) as RdapResponse;
                return this.normalizeRdapResponse(result, domain);
            },
            this.cacheTTL
        );
    }

    protected normalizeRdapResponse(response: RdapResponse, domain: string): WhoisData {
        // Extract registrar information
        const registrarEntity = response.entities?.find((entity) => entity.roles?.includes('registrar'));

        // Extract contact information from vCard
        const extractContactFromVCard = (vcardArray?: VCardArray): ContactInfo | undefined => {
            if (!vcardArray || vcardArray[0] !== 'vcard') return undefined;

            const properties = vcardArray[1];
            const contact: ContactInfo = {};

            for (const [prop, _params, _type, value] of properties) {
                switch (prop.toLowerCase()) {
                    case 'fn':
                        contact.name = value;
                        break;
                    case 'org':
                        contact.organization = value;
                        break;
                    case 'email':
                        contact.email = value;
                        break;
                    case 'tel':
                        // Handle tel:+1.123456789 format
                        contact.phone = value.replace('tel:', '');
                        break;
                    case 'adr':
                        // Address format: [post-office-box, extended-address, street, locality, region, postal-code, country]
                        if (Array.isArray(value)) {
                            contact.address = {
                                street: value[2] ? [value[2]] : undefined,
                                city: value[3],
                                state: value[4],
                                postalCode: value[5],
                                country: value[6],
                            };
                        }
                        break;
                }
            }

            return Object.keys(contact).length > 0 ? contact : undefined;
        };

        // Extract dates from events
        const getEventDate = (eventAction: string): Date | undefined => {
            const event = response.events?.find((e) => e.eventAction === eventAction);
            return event ? new Date(event.eventDate) : undefined;
        };

        // Extract nameservers
        const nameServers = response.nameservers?.map((ns) => ns.ldhName).filter(Boolean) as string[];

        // Extract DNSSEC status
        const dnssec = response.secureDNS?.delegationSigned || false;

        // Get registrar name from vCard
        const registrar = registrarEntity?.vcardArray
            ? extractContactFromVCard(registrarEntity.vcardArray)?.name ||
              extractContactFromVCard(registrarEntity.vcardArray)?.organization
            : undefined;

        return {
            domain,
            registrar,
            creationDate: getEventDate('registration'),
            expirationDate: getEventDate('expiration'),
            updatedDate: getEventDate('last changed') || getEventDate('last update of RDAP database'),
            nameServers,
            status: response.status,
            dnssec,
            source: 'rdap',
            rawRdap: response,
        };
    }
}
