import { AirportService } from './airport.service';
export declare class AirportController {
    private airportService;
    constructor(airportService: AirportService);
    getAirports(page?: number, limit?: number, iata_code?: string, icao_code?: string, persian_name?: string, english_name?: string, country_code?: string, time_zone?: number, latitude?: number, location_type_id?: number, altitude?: number, order_show?: number): Promise<{
        data: {
            iata_code: string;
            icao_code: string;
            persian_name: string;
            english_name: string;
            country_code: string;
            id: number;
            code: string;
            name_en: string;
            name_fa: string;
            city_code: string;
            city_name_en: string;
            city_name_fa: string;
            country: string;
            created_at: Date;
        }[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
}
