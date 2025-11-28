import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmDatabaseProviders } from './database.providers';
import { Airline } from 'src/modules/airline/models/airline.entity';
import { Airport } from 'src/modules/airport/airport.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const dataSource = await typeOrmDatabaseProviders[0].useFactory();
        return {
          ...dataSource.options,
          entities: [Airline, Airport], 
        };
      },
    }),
  ],
  providers: [...typeOrmDatabaseProviders],
  exports: [...typeOrmDatabaseProviders],
})
export class DatabaseModule {}
