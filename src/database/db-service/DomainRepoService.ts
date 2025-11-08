import { BaseRepositoryService } from '@app/database/core/BaseRepositoryService';
import type { RepositoryServiceInterface } from '@app/database/core/RepositoryServiceInterface';
import { DomainEntity } from '@app/database/entities';
import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';

@singleton()
export class DomainRepoService
    extends BaseRepositoryService<DomainEntity>
    implements RepositoryServiceInterface<DomainEntity>
{
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, DomainEntity);
    }
}
