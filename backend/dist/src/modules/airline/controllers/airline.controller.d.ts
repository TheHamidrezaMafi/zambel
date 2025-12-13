import { AirlineService } from '../services/airline.service';
export declare class AirlineController {
    private airlineService;
    constructor(airlineService: AirlineService);
    getAll(page?: number, limit?: number, persian_name?: string, english_name?: string, iata_code?: string, code?: string): Promise<{
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
