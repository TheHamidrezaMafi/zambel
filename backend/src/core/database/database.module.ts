import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmDatabaseProviders } from './database.providers';
import { Airline } from 'src/modules/airline/models/airline.entity';
import { Airport } from 'src/modules/airport/airport.entity';
import { TrackedFlight } from 'src/modules/flights/models/tracked-flight.entity';
import { FlightPriceHistory } from 'src/modules/flights/models/flight-price-history.entity';
import { LowestPriceSnapshot } from 'src/modules/flights/models/lowest-price-snapshot.entity';
import { RouteConfig } from 'src/modules/flights/models/route-config.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const dataSource = await typeOrmDatabaseProviders[0].useFactory();
        return {
          ...dataSource.options,
          entities: [
            Airline, 
            Airport,
            TrackedFlight,
            FlightPriceHistory,
            LowestPriceSnapshot,
            RouteConfig,
          ], 
        };
      },
    }),
  ],
  providers: [...typeOrmDatabaseProviders],
  exports: [...typeOrmDatabaseProviders],
})
export class DatabaseModule {}
