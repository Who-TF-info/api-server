import { AppEntity } from '@app/database/core/AppEntity';
import { Column, Entity, Index } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';

@Entity()
export class TopLevelDomainEntity extends AppEntity {
    @Column({ type: 'varchar', length: 63, nullable: false })
    @Index({ unique: true })
    @ZodProperty(z.string().max(63))
    tld: string;

    @Column({
        type: 'enum',
        enum: ['generic', 'country-code', 'sponsored', 'infrastructure'],
        nullable: false,
    })
    @ZodProperty(z.enum(['generic', 'country-code', 'sponsored', 'infrastructure']))
    type: 'generic' | 'country-code' | 'sponsored' | 'infrastructure';

    @Column({ type: 'varchar', length: 255, nullable: true })
    @ZodProperty(z.string().max(255).nullable().optional())
    whoisServer?: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @ZodProperty(z.string().max(255).nullable().optional())
    rdapServer?: string | null;

    @Column({ type: 'boolean', default: true, nullable: false })
    @Index()
    @ZodProperty(z.boolean().default(true))
    isActive: boolean;
}
