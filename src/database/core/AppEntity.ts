import { CreateDateColumn, DeleteDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';

export abstract class AppEntity {
    @PrimaryGeneratedColumn('increment')
    @ZodProperty(z.number())
    id: string;

    @CreateDateColumn()
    @Index()
    @ZodProperty(z.date())
    createdAt: Date;

    @UpdateDateColumn()
    @ZodProperty(z.date())
    updatedAt: Date;

    @DeleteDateColumn()
    @ZodProperty(z.date().nullable())
    deletedAt: Date;
}
