import { ScraperService } from 'src/modules/scraper/services/scraper.service';
export declare class FlightsService {
    private scraperService;
    constructor(scraperService: ScraperService);
    searchFlight(data: any): Promise<import("../../scraper/interfaces/scraper.interface").FlightProcessedByUserReqeust>;
}
