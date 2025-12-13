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
        host: process.env.POSTGRES_HOST || 'chogolisa.liara.cloud',
        port: parseInt(process.env.POSTGRES_PORT || '31593'),
        username: process.env.POSTGRES_USER || 'root',
        password: process.env.POSTGRES_PASSWORD || 'uOdMgLocGZfgtBabCufT46Im',
        database: process.env.POSTGRES_DATABASE || 'postgres',
        entities: [Airline],
        synchronize: false,
      });

      return await dataSource.initialize(); 
    },
  },
];
