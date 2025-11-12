import { TopLevelDomainRepoService } from '@app/database/db-service/TopLevelDomainRepoService';
import { IanaRdapImporter } from '@app/services/data/IanaRdapImporter';
import { WhoisMappingsImporter } from '@app/services/data/WhoisMappingsImporter';
import { AppLogger } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import type { Command } from 'commander';
import type { DependencyContainer } from 'tsyringe';

export const registerImportCommands = (program: Command, container: DependencyContainer) => {
    const logger = container.resolve(AppLogger);
    const cache = container.resolve(Keyv);
    const tldRepo = container.resolve(TopLevelDomainRepoService);

    program
        .command('import:rdap')
        .description('Import RDAP server mappings from IANA bootstrap data')
        .option('--dry-run', 'Show what would be imported without making changes')
        .action(async (options) => {
            const importer = new IanaRdapImporter({ logger, cache });

            try {
                logger.info('Starting IANA RDAP bootstrap import...');

                const mappings = await importer.fetch();
                logger.info({ count: mappings.length }, 'Fetched RDAP mappings');

                if (options.dryRun) {
                    logger.info({ sample: mappings.slice(0, 5) }, 'Sample mappings (dry-run mode)');
                    return;
                }

                let updated = 0;
                let created = 0;
                let skipped = 0;

                for (const mapping of mappings) {
                    const existing = await tldRepo.findOne({ tld: mapping.tld });

                    if (existing) {
                        if (existing.rdapServer !== mapping.rdapServer) {
                            await tldRepo.update(existing, {
                                rdapServer: mapping.rdapServer,
                            });
                            updated++;
                            logger.debug({ tld: mapping.tld, newServer: mapping.rdapServer }, 'Updated RDAP server');
                        } else {
                            skipped++;
                        }
                    } else {
                        await tldRepo.save({
                            tld: mapping.tld,
                            type: 'generic', // Default type, could be enhanced
                            rdapServer: mapping.rdapServer,
                            isActive: true,
                        });
                        created++;
                        logger.debug({ tld: mapping.tld }, 'Created new TLD with RDAP server');
                    }
                }

                logger.info(
                    { created, updated, skipped, total: mappings.length },
                    'RDAP import completed successfully'
                );
            } catch (error) {
                logger.error({ error }, 'Failed to import RDAP data');
                throw error;
            }
        });

    program
        .command('import:whois')
        .description('Import WHOIS server mappings from community-maintained data')
        .option('--dry-run', 'Show what would be imported without making changes')
        .action(async (options) => {
            const importer = new WhoisMappingsImporter({ logger, cache });

            try {
                logger.info('Starting community WHOIS mappings import...');

                const mappings = await importer.fetch();
                logger.info({ count: mappings.length }, 'Fetched WHOIS mappings');

                if (options.dryRun) {
                    logger.info({ sample: mappings.slice(0, 5) }, 'Sample mappings (dry-run mode)');
                    return;
                }

                let updated = 0;
                let created = 0;
                let skipped = 0;

                for (const mapping of mappings) {
                    const existing = await tldRepo.findOne({ tld: mapping.tld });

                    if (existing) {
                        if (existing.whoisServer !== mapping.whoisServer) {
                            await tldRepo.update(existing, {
                                whoisServer: mapping.whoisServer,
                            });
                            updated++;
                            logger.debug({ tld: mapping.tld, newServer: mapping.whoisServer }, 'Updated WHOIS server');
                        } else {
                            skipped++;
                        }
                    } else {
                        await tldRepo.save({
                            tld: mapping.tld,
                            type: 'generic', // Default type, could be enhanced
                            whoisServer: mapping.whoisServer,
                            isActive: true,
                        });
                        created++;
                        logger.debug({ tld: mapping.tld }, 'Created new TLD with WHOIS server');
                    }
                }

                logger.info(
                    { created, updated, skipped, total: mappings.length },
                    'WHOIS import completed successfully'
                );
            } catch (error) {
                logger.error({ error }, 'Failed to import WHOIS data');
                throw error;
            }
        });
};
