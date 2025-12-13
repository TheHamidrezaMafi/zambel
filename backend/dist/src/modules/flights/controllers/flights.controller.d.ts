import { FlightsService } from '../services/flights.service';
import { FlightSearchDTO } from '../dto/flight.dto';
import { FlightSearchDto, PriceHistoryQueryDto, PriceDropQueryDto, ScrapingStatsQueryDto } from '../dto/flight-search.dto';
export declare class FlightsController {
    private flightService;
    constructor(flightService: FlightsService);
    searchFlight(document: FlightSearchDTO): Promise<import("../services/flight-aggregation.service").AggregatedSearchResult | {
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
    getPriceHistory(baseFlightId: string, query: PriceHistoryQueryDto): Promise<{
        base_flight_id: string;
        changes: import("../repositories/flight-database.repository").PriceChange[];
        total_changes: number;
        hours_back: number;
    }> | Promise<{
        base_flight_id: string;
        history: import("../repositories/flight-database.repository").PriceHistoryPoint[];
        total_snapshots: number;
        hours_back: number;
    }>;
    getPriceChanges(baseFlightId: string, query: PriceHistoryQueryDto): Promise<{
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
    getPriceComparison(baseFlightId: string): Promise<{
        base_flight_id: string;
        providers: import("../repositories/flight-database.repository").ProviderComparison[];
        best_deal: import("../repositories/flight-database.repository").ProviderComparison;
        price_difference: number;
    }>;
    getCapacityTrend(baseFlightId: string, query: PriceHistoryQueryDto): Promise<{
        base_flight_id: string;
        capacity_trend: import("../repositories/flight-database.repository").CapacityTrend[];
        booking_rate: number;
        urgency_level: string;
    }>;
    getPriceDrops(query: PriceDropQueryDto): Promise<{
        route: string;
        dates: string[];
        threshold_percent: number;
        price_drops: import("../repositories/flight-database.repository").PriceDrop[];
        total_alerts: number;
    }>;
    getScrapingStats(query: ScrapingStatsQueryDto): Promise<{
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
