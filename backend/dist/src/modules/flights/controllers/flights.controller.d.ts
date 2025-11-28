import { FlightsService } from '../services/flights.service';
import { FlightSearchDTO } from '../dto/flight.dto';
export declare class FlightsController {
    private flightService;
    constructor(flightService: FlightsService);
    searchFlight(document: FlightSearchDTO): Promise<import("../../scraper/interfaces/scraper.interface").FlightProcessedByUserReqeust>;
}
