import { Repository } from 'typeorm';
import { Airport } from './airport.entity';
export declare class AirportService {
    private airportRepository;
    constructor(airportRepository: Repository<Airport>);
    getAirports(page?: number, limit?: number, filters?: Partial<Airport>): Promise<{
        data: Airport[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
}
