import { Body, Controller, Post } from '@nestjs/common';
import { ScraperService } from '../services/scraper.service';
import {
  FlightProcessedByUserReqeust,
  GetRequestedFlightsByUserResponse,
} from '../interfaces/scraper.interface';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  takeRequests(
    @Body() requests: GetRequestedFlightsByUserResponse,
  ): Promise<FlightProcessedByUserReqeust> {
    return this.scraperService.takeRequests(requests);
  }
}
