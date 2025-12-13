import { ScraperHttpService } from 'src/modules/scraper/services/scraper-http.service';
import { FlightDatabaseRepository } from '../repositories/flight-database.repository';
import { FlightSearchDto } from '../dto/flight-search.dto';
import { FlightAggregationService } from './flight-aggregation.service';
export declare class FlightsService {
    private scraperService;
    private flightDatabase;
    private aggregationService;
    private readonly logger;
    constructor(scraperService: ScraperHttpService, flightDatabase: FlightDatabaseRepository, aggregationService: FlightAggregationService);
    searchFlight(data: any): Promise<import("./flight-aggregation.service").AggregatedSearchResult | {
        flights: any[];
        metadata: {
            total_flights: number;
            total_options: number;
            providers_queried: any[];
            providers_successful: any[];
            providers_failed: any[];
            search_time_ms: number;
            cached: boolean;
            error: string;
        };
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    } | {
        flights: any[];
        metadata: {
            total_flights: number;
            total_options: number;
            providers_queried: any[];
            providers_successful: any[];
            providers_failed: any[];
            search_time_ms: number;
            cached: boolean;
            error: any;
        };
        pagination?: undefined;
    }>;
    searchFlightLegacy(data: any): Promise<{
        flights: any[];
    }>;
    searchFlightEnhanced(searchDto: FlightSearchDto): Promise<{
        flights: any[];
        total: number;
        source: string;
        cached: boolean;
        cache_age_minutes: number;
        response_time_ms: number;
    } | {
        flights: any[];
        total: number;
        source: string;
        cached: boolean;
        response_time_ms: number;
        cache_age_minutes?: undefined;
    }>;
    private isDataFresh;
    private getCacheAgeMinutes;
    getPriceHistory(baseFlightId: string, hoursBack?: number): Promise<{
        base_flight_id: string;
        history: import("../repositories/flight-database.repository").PriceHistoryPoint[];
        total_snapshots: number;
        hours_back: number;
    }>;
    getPriceChanges(baseFlightId: string, hoursBack?: number): Promise<{
        base_flight_id: string;
        changes: import("../repositories/flight-database.repository").PriceChange[];
        total_changes: number;
        hours_back: number;
    }>;
    getDailyStats(baseFlightId: string): Promise<{
        base_flight_id: string;
        daily_stats: import("../repositories/flight-database.repository").DailyStats[];
        insights: {
            overall_min: number;
            overall_max: number;
            overall_avg: number;
            avg_volatility: number;
            trend: string;
            recommendation: string;
        };
    }>;
    private calculatePriceInsights;
    private calculateTrend;
    private generateRecommendation;
    getPriceComparison(baseFlightId: string): Promise<{
        base_flight_id: string;
        providers: import("../repositories/flight-database.repository").ProviderComparison[];
        best_deal: import("../repositories/flight-database.repository").ProviderComparison;
        price_difference: number;
    }>;
    getCapacityTrend(baseFlightId: string, hoursBack?: number): Promise<{
        base_flight_id: string;
        capacity_trend: import("../repositories/flight-database.repository").CapacityTrend[];
        booking_rate: number;
        urgency_level: string;
    }>;
    private calculateBookingRate;
    private assessUrgency;
    getPriceDrops(origin: string, destination: string, dates: string[], threshold?: number): Promise<{
        route: string;
        dates: string[];
        threshold_percent: number;
        price_drops: import("../repositories/flight-database.repository").PriceDrop[];
        total_alerts: number;
    }>;
    getScrapingStats(hoursBack?: number): Promise<{
        period_hours: number;
        providers: import("../repositories/flight-database.repository").ScrapingStats[];
        total_scrapes: number;
        total_flights: number;
    }>;
    getFlightDetails(baseFlightId: string): Promise<{
        base_flight_id: string;
        flight_info: any;
        current_pricing: any;
        price_comparison: import("../repositories/flight-database.repository").ProviderComparison[];
        daily_stats: import("../repositories/flight-database.repository").DailyStats[];
        last_updated: any;
    }>;
}
