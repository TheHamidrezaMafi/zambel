import { AirportService } from './airport.service';
export declare class AirportController {
    private airportService;
    constructor(airportService: AirportService);
    getAirports(page?: number, limit?: number, iata_code?: string, icao_code?: string, persian_name?: string, english_name?: string, country_code?: string, time_zone?: number, latitude?: number, location_type_id?: number, altitude?: number, order_show?: number): Promise<{
        data: import("./airport.entity").Airport[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
}
