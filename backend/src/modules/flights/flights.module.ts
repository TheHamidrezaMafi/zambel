import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { FlightsController } from './controllers/flights.controller';
import { FlightTrackingController } from './controllers/flight-tracking.controller';
import { FlightsService } from './services/flights.service';
import { FlightTrackingService } from './services/flight-tracking.service';
import { AutomatedFlightTrackerService } from './services/automated-flight-tracker.service';
import { flightProviders } from './providers/flight.provider';
import { ScraperModule } from '../scraper/scraper.module';
import { TrackedFlight } from './models/tracked-flight.entity';
import { FlightPriceHistory } from './models/flight-price-history.entity';
import { LowestPriceSnapshot } from './models/lowest-price-snapshot.entity';
import { RouteConfig } from './models/route-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackedFlight, FlightPriceHistory, LowestPriceSnapshot, RouteConfig]),
    ScheduleModule.forRoot(),
    ScraperModule,
  ],
  controllers: [FlightsController, FlightTrackingController],
  providers: [
    FlightsService,
    FlightTrackingService,
    AutomatedFlightTrackerService,
    ...flightProviders,
  ],
  exports: [FlightsService, FlightTrackingService],
})
export class FlightsModule {}
