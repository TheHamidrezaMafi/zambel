import { AirlineService } from '../services/airline.service';
export declare class AirlineController {
    private airlineService;
    constructor(airlineService: AirlineService);
    getAll(page?: number, limit?: number, persian_name?: string, english_name?: string, iata_code?: string, country_code?: string, digit_code?: string, logo_url?: string): Promise<{
        data: {
            logo_url: string;
            original_logo_url: string;
            id: number;
            persian_name: string;
            english_name: string;
            iata_code: string;
            country_code: string;
            digit_code: string;
        }[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
}
