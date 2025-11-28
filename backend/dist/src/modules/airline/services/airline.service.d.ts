import { Repository } from 'typeorm';
import { Airline } from '../models/airline.entity';
export declare class AirlineService {
    private airlineRepository;
    private logoMap;
    constructor(airlineRepository: Repository<Airline>);
    private loadLogoMap;
    private getLocalLogoUrl;
    getAllAirlines(page?: number, limit?: number, filters?: Partial<Airline>): Promise<{
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
