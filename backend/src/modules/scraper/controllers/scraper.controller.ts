import { Body, Controller, Post } from '@nestjs/common';
import { ScraperHttpService } from '../services/scraper-http.service';
import {
  FlightProcessedByUserReqeust,
  GetRequestedFlightsByUserResponse,
} from '../interfaces/scraper.interface';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperHttpService) {}

  @Post()
  takeRequests(
    @Body() requests: GetRequestedFlightsByUserResponse,
  ): Promise<FlightProcessedByUserReqeust> {
    return this.scraperService.takeRequests(requests);
  }
}
