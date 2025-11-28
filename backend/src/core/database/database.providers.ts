import { DataSource } from 'typeorm';
import { DEVELOPMENT, PRODUCTION, TEST } from '../../core/constants';
import { databaseConfig } from './database.config';
import { Airline } from 'src/modules/airline/models/airline.entity';

export const typeOrmDatabaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      let config;
      switch (process.env.NODE_ENV) {
        case DEVELOPMENT:
          config = databaseConfig.development;
          break;
        case TEST:
          config = databaseConfig.test;
          break;
        case PRODUCTION:
          config = databaseConfig.production;
          break;
        default:
          config = databaseConfig.development;
      }

      const dataSource = new DataSource({
        type: 'postgres',
        host: 'chogolisa.liara.cloud',
        port: 34352,
        username: 'root',
        password: 'rWWZ82a4rQn5oBJEnIK9tEBk',
        database: 'postgres',
        entities: [Airline],
        synchronize: false,
      });

      return await dataSource.initialize(); 
    },
  },
];
