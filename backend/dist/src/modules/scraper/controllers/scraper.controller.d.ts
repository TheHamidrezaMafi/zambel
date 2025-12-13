import { ScraperHttpService } from '../services/scraper-http.service';
import { FlightProcessedByUserReqeust, GetRequestedFlightsByUserResponse } from '../interfaces/scraper.interface';
export declare class ScraperController {
    private readonly scraperService;
    constructor(scraperService: ScraperHttpService);
    takeRequests(requests: GetRequestedFlightsByUserResponse): Promise<FlightProcessedByUserReqeust>;
}
