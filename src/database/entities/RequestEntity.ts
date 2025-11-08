import { AppEntity } from '@app/database/core/AppEntity';
import type { Relation } from 'typeorm';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';
import { DomainEntity } from './DomainEntity';
import { UserEntity } from './UserEntity';

@Entity()
@Index(['userId', 'requestedAt'])
@Index(['domainId', 'requestedAt'])
@Index(['requestType'])
@Index(['statusCode'])
@Index(['requestedAt'])
export class RequestEntity extends AppEntity {
    // Foreign key relationships
    @ManyToOne(() => UserEntity, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    @ZodProperty(z.instanceof(UserEntity))
    user: Relation<UserEntity>;

    @Column({ type: 'int', nullable: false })
    @Index()
    @ZodProperty(z.number())
    userId: number;

    @ManyToOne(() => DomainEntity, { nullable: false })
    @JoinColumn({ name: 'domain_id' })
    @ZodProperty(z.instanceof(DomainEntity))
    domain: Relation<DomainEntity>;

    @Column({ type: 'int', nullable: false })
    @Index()
    @ZodProperty(z.number())
    domainId: number;

    // Request metadata
    @Column({
        type: 'enum',
        enum: ['availability', 'whois', 'bulk'],
        nullable: false,
    })
    @Index()
    @ZodProperty(z.enum(['availability', 'whois', 'bulk']))
    requestType: 'availability' | 'whois' | 'bulk';

    @Column({ type: 'varchar', length: 255, nullable: false })
    @ZodProperty(z.string().max(255))
    endpoint: string;

    @Column({ type: 'varchar', length: 10, nullable: false })
    @ZodProperty(z.string().max(10))
    method: string;

    @Column({ type: 'int', nullable: false })
    @Index()
    @ZodProperty(z.number().int())
    statusCode: number;

    @Column({ type: 'int', nullable: false })
    @ZodProperty(z.number().int())
    responseTimeMs: number;

    @Column({ type: 'boolean', default: false, nullable: false })
    @ZodProperty(z.boolean().default(false))
    cacheHit: boolean;

    // Error tracking
    @Column({ type: 'varchar', length: 50, nullable: true })
    @ZodProperty(z.string().max(50).nullable().optional())
    errorCode?: string | null;

    @Column({ type: 'text', nullable: true })
    @ZodProperty(z.string().nullable().optional())
    errorMessage?: string | null;

    // Client metadata
    @Column({ type: 'varchar', length: 45, nullable: true })
    @ZodProperty(z.string().max(45).nullable().optional())
    ipAddress?: string | null;

    @Column({ type: 'text', nullable: true })
    @ZodProperty(z.string().nullable().optional())
    userAgent?: string | null;

    @Column({ type: 'timestamp', nullable: false })
    @Index()
    @ZodProperty(z.date())
    requestedAt: Date;
}
