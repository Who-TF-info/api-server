import { AppEntity } from '@app/database/core/AppEntity';
import { Column, Entity, Index } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';

@Entity()
export class SettingEntity extends AppEntity {
    @Column({ type: 'varchar', length: 100, nullable: true })
    @Index({ unique: true })
    @ZodProperty(z.string().max(100))
    key: string;

    @Column({ type: 'text', nullable: true })
    @ZodProperty(z.string().nullable().optional())
    value?: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @ZodProperty(z.string().max(255).nullable().optional())
    description?: string | null;
}
