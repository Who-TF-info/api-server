import { appConfig } from '@app/config';
import { createDataSourceOptions } from '@app/utils/createDataSourceOptions';

/**
 * Package-level data source for migrations and package internal use
 */
export const AppDataSource = createDataSourceOptions(appConfig);
