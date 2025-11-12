import { BaseRepositoryService } from '@app/database/core/BaseRepositoryService';
import type { RepositoryServiceInterface } from '@app/database/core/RepositoryServiceInterface';
import { SettingEntity } from '@app/database/entities/SettingEntity';
import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';

@singleton()
export class SettingRepoService
    extends BaseRepositoryService<SettingEntity>
    implements RepositoryServiceInterface<SettingEntity>
{
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, SettingEntity);
    }
}
