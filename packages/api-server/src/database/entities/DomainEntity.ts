import { AppEntity } from '@app/database/core/AppEntity';
import type { Relation } from 'typeorm';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';
import { DomainNameEntity } from './DomainNameEntity';
import { TopLevelDomainEntity } from './TopLevelDomainEntity';

@Entity()
export class DomainEntity extends AppEntity {
    // Foreign key relationships
    @ManyToOne(() => DomainNameEntity, { nullable: false })
    @JoinColumn({ name: 'domain_name_id' })
    @ZodProperty(z.instanceof(DomainNameEntity))
    domainName: Relation<DomainNameEntity>;

    @Column({ type: 'int', nullable: false })
    @Index()
    @ZodProperty(z.number())
    domainNameId: number;

    @ManyToOne(() => TopLevelDomainEntity, { nullable: false })
    @JoinColumn({ name: 'top_level_domain_id' })
    @ZodProperty(z.instanceof(TopLevelDomainEntity))
    topLevelDomain: Relation<TopLevelDomainEntity>;

    @Column({ type: 'int', nullable: false })
    @Index()
    @ZodProperty(z.number())
    topLevelDomainId: number;

    // Core domain data
    @Column({ type: 'varchar', length: 255, nullable: false })
    @Index({ unique: true })
    @ZodProperty(z.string().max(255))
    fullDomain: string;

    // Availability caching
    @Column({ type: 'boolean', nullable: true })
    @ZodProperty(z.boolean().nullable().optional())
    isAvailable?: boolean | null;

    @Column({ type: 'timestamp', nullable: true })
    @ZodProperty(z.date().nullable().optional())
    availabilityCheckedAt?: Date | null;

    @Column({
        type: 'enum',
        enum: ['dns', 'porkbun', 'whois'],
        nullable: true,
    })
    @ZodProperty(z.enum(['dns', 'porkbun', 'whois']).nullable().optional())
    availabilityMethod?: 'dns' | 'porkbun' | 'whois' | null;

    @Column({ type: 'timestamp', nullable: true })
    @Index()
    @ZodProperty(z.date().nullable().optional())
    availabilityTtlExpiresAt?: Date | null;

    // WHOIS caching
    @Column({ type: 'json', nullable: true })
    @ZodProperty(z.record(z.unknown()).nullable().optional())
    whoisData?: Record<string, unknown> | null;

    @Column({ type: 'timestamp', nullable: true })
    @ZodProperty(z.date().nullable().optional())
    whoisCheckedAt?: Date | null;

    @Column({ type: 'enum', enum: ['rdap', 'whois'], nullable: true })
    @ZodProperty(z.enum(['rdap', 'whois']).nullable().optional())
    whoisSource?: 'rdap' | 'whois' | null;

    @Column({ type: 'timestamp', nullable: true })
    @Index()
    @ZodProperty(z.date().nullable().optional())
    whoisTtlExpiresAt?: Date | null;

    // Parsed WHOIS fields
    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    @ZodProperty(z.string().max(255).nullable().optional())
    registrar?: string | null;

    @Column({ type: 'timestamp', nullable: true })
    @ZodProperty(z.date().nullable().optional())
    registrationDate?: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    @Index()
    @ZodProperty(z.date().nullable().optional())
    expirationDate?: Date | null;

    @Column({ type: 'json', nullable: true })
    @ZodProperty(z.array(z.string()).nullable().optional())
    nameServers?: string[] | null;

    @Column({ type: 'json', nullable: true })
    @ZodProperty(z.array(z.string()).nullable().optional())
    status?: string[] | null;
}
