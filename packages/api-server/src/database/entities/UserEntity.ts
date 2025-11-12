import { AppEntity } from '@app/database/core/AppEntity';
import { Column, Entity, Index } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';

@Entity()
export class UserEntity extends AppEntity {
    @Column({ type: 'varchar', length: 200, nullable: false })
    @ZodProperty(z.string().max(200))
    name: string;

    @Column({ type: 'varchar', length: 40, nullable: false })
    @Index({ unique: true })
    @ZodProperty(z.string().max(40).min(32))
    apiKey: string;

    @Column({ type: 'boolean', default: false, nullable: false })
    @Index()
    @ZodProperty(z.boolean().default(false))
    isActive: boolean;

    @Column({ type: 'date', nullable: true, default: null })
    @ZodProperty(z.date().nullable().optional().default(null))
    lastRequestAt?: Date | null;

    @Column({ type: 'int', nullable: false, default: 0 })
    @ZodProperty(z.number().default(0))
    totalRequests: number;
}
