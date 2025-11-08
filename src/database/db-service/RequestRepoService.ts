import { BaseRepositoryService } from '@app/database/core/BaseRepositoryService';
import type { RepositoryServiceInterface } from '@app/database/core/RepositoryServiceInterface';
import { RequestEntity } from '@app/database/entities';
import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';

@singleton()
export class RequestRepoService
    extends BaseRepositoryService<RequestEntity>
    implements RepositoryServiceInterface<RequestEntity>
{
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, RequestEntity);
    }
}
