import { BaseRepositoryService } from '@app/database/core/BaseRepositoryService';
import type { RepositoryServiceInterface } from '@app/database/core/RepositoryServiceInterface';
import { TopLevelDomainEntity } from '@app/database/entities';
import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';

@singleton()
export class TopLevelDomainRepoService
    extends BaseRepositoryService<TopLevelDomainEntity>
    implements RepositoryServiceInterface<TopLevelDomainEntity>
{
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, TopLevelDomainEntity);
    }
}
