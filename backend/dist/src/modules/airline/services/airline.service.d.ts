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
            code: string;
            name_fa: string;
            name_en: string;
            created_at: Date;
            updated_at: Date;
        }[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
}
