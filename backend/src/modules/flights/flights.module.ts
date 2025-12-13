import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FlightsController } from './controllers/flights.controller';
import { FlightTrackingController } from './controllers/flight-tracking.controller';
import { FlightsStreamController } from './controllers/flights-stream.controller';
import { FlightsService } from './services/flights.service';
import { FlightTrackingService } from './services/flight-tracking.service';
import { AutomatedFlightTrackerService } from './services/automated-flight-tracker.service';
import { FlightAggregationService } from './services/flight-aggregation.service';
import { PriceHistoryTrackerService } from './services/price-history-tracker.service';
import { FlightTrackingProgressService } from './services/flight-tracking-progress.service';
import { ScrapingSessionService } from './services/scraping-session.service';
import { FlightStreamService } from './services/flight-stream.service';
import { flightProviders } from './providers/flight.provider';
import { ScraperModule } from '../scraper/scraper.module';
import { PostgresModule } from '../../core/database/postgres.module';
import { FlightDatabaseRepository } from './repositories/flight-database.repository';
import { TrackedFlight } from './models/tracked-flight.entity';
import { FlightPriceHistory } from './models/flight-price-history.entity';
import { LowestPriceSnapshot } from './models/lowest-price-snapshot.entity';
import { RouteConfig } from './models/route-config.entity';
import { ScrapingSession } from './models/scraping-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackedFlight, FlightPriceHistory, LowestPriceSnapshot, RouteConfig, ScrapingSession]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ScraperModule,
    PostgresModule,
  ],
  controllers: [FlightsController, FlightTrackingController, FlightsStreamController],
  providers: [
    FlightsService,
    FlightTrackingService,
    AutomatedFlightTrackerService,
    FlightAggregationService,
    PriceHistoryTrackerService,
    FlightTrackingProgressService,
    ScrapingSessionService,
    FlightStreamService,
    FlightDatabaseRepository,
    ...flightProviders,
  ],
  exports: [FlightsService, FlightTrackingService, FlightDatabaseRepository, FlightAggregationService, PriceHistoryTrackerService],
})
export class FlightsModule {}
