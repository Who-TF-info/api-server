import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';

@Entity()
export class SettingEntity {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    @ZodProperty(z.string().max(100))
    key: string;

    @Column({ type: 'text', nullable: true })
    @ZodProperty(z.string().nullable().optional())
    value?: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @ZodProperty(z.string().max(255).nullable().optional())
    description?: string | null;

    @Column({ type: 'timestamp', nullable: false })
    @ZodProperty(z.date())
    updatedAt: Date;
}
