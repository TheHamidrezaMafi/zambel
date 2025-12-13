import { Repository } from 'typeorm';
import { Airport } from './airport.entity';
export declare class AirportService {
    private airportRepository;
    constructor(airportRepository: Repository<Airport>);
    getAirports(page?: number, limit?: number, filters?: Partial<Airport>): Promise<{
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
