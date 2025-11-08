import { AppEntity } from '@app/database/core/AppEntity';
import { Column, Entity, Index } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';

@Entity()
export class DomainNameEntity extends AppEntity {
    @Column({ type: 'varchar', length: 253, nullable: false })
    @Index({ unique: true })
    @ZodProperty(z.string().max(253))
    name: string;
}
