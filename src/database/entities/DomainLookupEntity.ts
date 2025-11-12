import { AppEntity } from '@app/database/core/AppEntity';
import type { Relation } from 'typeorm';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';
import { DomainEntity } from './DomainEntity';
import { RequestEntity } from './RequestEntity';

@Entity()
@Index(['lookupType', 'success'])
export class DomainLookupEntity extends AppEntity {
    // Foreign key relationships
    @ManyToOne(() => RequestEntity, { nullable: false })
    @JoinColumn({ name: 'request_id' })
    @ZodProperty(z.instanceof(RequestEntity))
    request: Relation<RequestEntity>;

    @Column({ type: 'int', nullable: false })
    @Index()
    @ZodProperty(z.number())
    requestId: number;

    @ManyToOne(() => DomainEntity, { nullable: true })
    @JoinColumn({ name: 'domain_id' })
    @ZodProperty(z.instanceof(DomainEntity).nullable().optional())
    domain?: Relation<DomainEntity> | null;

    @Column({ type: 'int', nullable: true })
    @Index()
    @ZodProperty(z.number().nullable().optional())
    domainId?: number | null;

    // Domain lookup specific data
    @Column({ type: 'varchar', length: 255, nullable: false })
    @Index()
    @ZodProperty(z.string().max(255))
    domainName: string;

    @Column({
        type: 'enum',
        enum: ['availability', 'whois'],
        nullable: false,
    })
    @Index()
    @ZodProperty(z.enum(['availability', 'whois']))
    lookupType: 'availability' | 'whois';

    @Column({ type: 'boolean', nullable: false })
    @Index()
    @ZodProperty(z.boolean())
    success: boolean;

    @Column({ type: 'boolean', nullable: false, default: false })
    @ZodProperty(z.boolean().default(false))
    cacheHit: boolean;

    @Column({ type: 'int', nullable: false })
    @ZodProperty(z.number().int())
    processingTimeMs: number;

    // Error tracking
    @Column({ type: 'varchar', length: 50, nullable: true })
    @ZodProperty(z.string().max(50).nullable().optional())
    errorCode?: string | null;

    @Column({ type: 'text', nullable: true })
    @ZodProperty(z.string().nullable().optional())
    errorMessage?: string | null;

    // WHOIS data (JSON column)
    @Column({ type: 'json', nullable: true })
    @ZodProperty(z.record(z.unknown()).nullable().optional())
    whoisData?: Record<string, unknown> | null;

    // Domain availability result
    @Column({ type: 'boolean', nullable: true })
    @ZodProperty(z.boolean().nullable().optional())
    isAvailable?: boolean | null;
}
