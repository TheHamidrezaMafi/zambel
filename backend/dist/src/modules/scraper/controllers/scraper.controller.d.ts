import { ScraperService } from '../services/scraper.service';
import { FlightProcessedByUserReqeust, GetRequestedFlightsByUserResponse } from '../interfaces/scraper.interface';
export declare class ScraperController {
    private readonly scraperService;
    constructor(scraperService: ScraperService);
    takeRequests(requests: GetRequestedFlightsByUserResponse): Promise<FlightProcessedByUserReqeust>;
}
