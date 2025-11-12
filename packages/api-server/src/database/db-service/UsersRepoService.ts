import { BaseRepositoryService } from '@app/database/core/BaseRepositoryService';
import type { RepositoryServiceInterface } from '@app/database/core/RepositoryServiceInterface';
import { UserEntity } from '@app/database/entities/UserEntity';
import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';

@singleton()
export class UsersRepoService
    extends BaseRepositoryService<UserEntity>
    implements RepositoryServiceInterface<UserEntity>
{
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, UserEntity);
    }
}
