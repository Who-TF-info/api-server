import { BaseRepositoryService } from '@app/database/core/BaseRepositoryService';
import type { RepositoryServiceInterface } from '@app/database/core/RepositoryServiceInterface';
import { DomainNameEntity } from '@app/database/entities/DomainNameEntity';
import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';

@singleton()
export class DomainNameRepoService
    extends BaseRepositoryService<DomainNameEntity>
    implements RepositoryServiceInterface<DomainNameEntity>
{
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, DomainNameEntity);
    }
}
