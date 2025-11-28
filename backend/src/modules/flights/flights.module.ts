import { Module } from '@nestjs/common';
import { FlightsController } from './controllers/flights.controller';
import { FlightsService } from './services/flights.service';
import { flightProviders } from './providers/flight.provider';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [ScraperModule],
  controllers: [FlightsController],
  providers: [FlightsService, ...flightProviders],
  exports: [FlightsService],
})
export class FlightsModule {}
