import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '../../../core/database/postgres.service';

/**
 * Unified Flight Format Interface (matches Python scraper output)
 */
export interface UnifiedFlight {
  base_flight_id: string;
  flight_id: string;
  provider_source: string;
  original_id: string;
  flight_number: string;
  airline: {
    code: string;
    name_en?: string;
    name_fa?: string;
    logo_url?: string;
  };
  operating_airline?: {
    code?: string;
    name_en?: string;
    name_fa?: string;
  };
  aircraft?: {
    type?: string;
    code?: string;
  };
  route: {
    origin: {
      airport_code: string;
      airport_name_en?: string;
      airport_name_fa?: string;
      city_code?: string;
      city_name_en?: string;
      city_name_fa?: string;
      terminal?: string;
    };
    destination: {
      airport_code: string;
      airport_name_en?: string;
      airport_name_fa?: string;
      city_code?: string;
      city_name_en?: string;
      city_name_fa?: string;
      terminal?: string;
    };
  };
  schedule: {
    departure_datetime: string;
    arrival_datetime: string;
    departure_date_jalali?: string;
    arrival_date_jalali?: string;
    duration_minutes?: number;
    stops?: number;
    connection_time_minutes?: number;
  };
  pricing: {
    adult: {
      base_fare: number;
      total_fare: number;
      taxes?: number;
      service_charge?: number;
      commission?: number;
    };
    child?: {
      base_fare: number;
      total_fare: number;
      taxes?: number;
      service_charge?: number;
      commission?: number;
    };
    infant?: {
      base_fare: number;
      total_fare: number;
      taxes?: number;
      service_charge?: number;
      commission?: number;
    };
    currency: string;
  };
  cabin?: {
    class: string;
    class_display_name_fa?: string;
    booking_class?: string;
  };
  ticket_info: {
    type: string;
    is_charter: boolean;
    is_refundable: boolean;
    is_domestic: boolean;
    capacity: number;
    reservable: boolean;
    requires_passport?: boolean;
  };
  policies?: {
    cancellation_rules?: any[];
    baggage_allowance?: any;
  };
  metadata?: {
    scraped_at?: string;
    [key: string]: any;
  };
}

/**
 * Price History Point
 */
export interface PriceHistoryPoint {
  scraped_at: string;
  provider_source: string;
  adult_base_fare: number;
  adult_total_fare: number;
  child_total_fare?: number;
  infant_total_fare?: number;
  capacity: number;
  is_available: boolean;
  age_minutes: number;
}

/**
 * Price Change Event
 */
export interface PriceChange {
  scraped_at: string;
  provider_source: string;
  adult_total_fare: number;
  capacity: number;
  price_change: number;
  price_change_percent: number;
  capacity_change: number;
}

/**
 * Daily Statistics
 */
export interface DailyStats {
  date: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  price_volatility: number;
  min_capacity: number;
  max_capacity: number;
  scrape_count: number;
  cheapest_provider: string;
}

/**
 * Provider Price Comparison
 */
export interface ProviderComparison {
  provider_source: string;
  adult_total_fare: number;
  capacity: number;
  age_minutes: number;
  is_available: boolean;
}

/**
 * Capacity Trend Point
 */
export interface CapacityTrend {
  scraped_at: string;
  provider_source: string;
  capacity: number;
  capacity_change: number;
  hours_until_departure: number;
  booking_velocity: number;
}

/**
 * Price Drop Alert
 */
export interface PriceDrop {
  base_flight_id: string;
  flight_number: string;
  airline_code: string;
  origin: string;
  destination: string;
  departure_datetime: string;
  current_price: number;
  previous_price: number;
  price_drop: number;
  drop_percentage: number;
  provider_source: string;
  hours_ago: number;
}

/**
 * Scraping Statistics
 */
export interface ScrapingStats {
  provider: string;
  scrape_count: number;
  flights_found: number;
  avg_flights_per_scrape: number;
  first_scrape: string;
  last_scrape: string;
  scrape_frequency_minutes: number;
}

@Injectable()
export class FlightDatabaseRepository {
  private readonly logger = new Logger(FlightDatabaseRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  /**
   * Find cheapest flights for a route and date range
   */
  async findCheapestFlights(
    origin: string,
    destination: string,
    dateFrom: string,
    dateTo: string,
    limit: number = 20,
  ): Promise<any[]> {
    try {
      const query = `SELECT * FROM find_cheapest_flights($1, $2, $3, $4, $5)`;
      const result = await this.postgres.queryMany(query, [
        origin,
        destination,
        dateFrom,
        dateTo,
        limit,
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error finding cheapest flights: ${error}`);
      throw error;
    }
  }

  /**
   * Get complete price history for a flight
   */
  async getFlightPriceHistory(
    baseFlightId: string,
    hoursBack: number = 168, // 7 days default
  ): Promise<PriceHistoryPoint[]> {
    try {
      const query = `SELECT * FROM get_flight_price_history($1, $2)`;
      const result = await this.postgres.queryMany<PriceHistoryPoint>(query, [
        baseFlightId,
        hoursBack,
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting price history: ${error}`);
      throw error;
    }
  }

  /**
   * Get only price changes (not all snapshots)
   */
  async getFlightPriceChanges(
    baseFlightId: string,
    hoursBack: number = 168,
  ): Promise<PriceChange[]> {
    try {
      const query = `SELECT * FROM get_flight_price_changes($1, $2)`;
      const result = await this.postgres.queryMany<PriceChange>(query, [
        baseFlightId,
        hoursBack,
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting price changes: ${error}`);
      throw error;
    }
  }

  /**
   * Get daily statistics for a flight
   */
  async getFlightDailyStats(baseFlightId: string): Promise<DailyStats[]> {
    try {
      const query = `SELECT * FROM get_flight_daily_stats($1)`;
      const result = await this.postgres.queryMany<DailyStats>(query, [baseFlightId]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting daily stats: ${error}`);
      throw error;
    }
  }

  /**
   * Compare prices across providers at a specific time
   */
  async getFlightPriceComparison(
    baseFlightId: string,
    atTime?: string,
  ): Promise<ProviderComparison[]> {
    try {
      const query = `SELECT * FROM get_flight_price_comparison($1, $2)`;
      const result = await this.postgres.queryMany<ProviderComparison>(query, [
        baseFlightId,
        atTime || new Date().toISOString(),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting price comparison: ${error}`);
      throw error;
    }
  }

  /**
   * Get capacity trend (booking velocity)
   */
  async getCapacityTrend(
    baseFlightId: string,
    hoursBack: number = 168,
  ): Promise<CapacityTrend[]> {
    try {
      const query = `SELECT * FROM get_capacity_trend($1, $2)`;
      const result = await this.postgres.queryMany<CapacityTrend>(query, [
        baseFlightId,
        hoursBack,
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting capacity trend: ${error}`);
      throw error;
    }
  }

  /**
   * Find recent price drops for alerts
   */
  async getPriceDrops(
    origin: string,
    destination: string,
    dates: string[],
    threshold: number = 10, // 10% default
  ): Promise<PriceDrop[]> {
    try {
      const query = `SELECT * FROM get_price_drops($1, $2, $3, $4)`;
      const result = await this.postgres.queryMany<PriceDrop>(query, [
        origin,
        destination,
        dates,
        threshold,
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting price drops: ${error}`);
      throw error;
    }
  }

  /**
   * Get scraping statistics
   */
  async getScrapingStats(hoursBack: number = 24): Promise<ScrapingStats[]> {
    try {
      const query = `SELECT * FROM get_scraping_stats($1)`;
      const result = await this.postgres.queryMany<ScrapingStats>(query, [hoursBack]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting scraping stats: ${error}`);
      throw error;
    }
  }

  /**
   * Get flight details by base_flight_id
   */
  async getFlightByBaseId(baseFlightId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          f.*,
          a.code as airline_code,
          a.name_en as airline_name_en,
          a.name_fa as airline_name_fa,
          a.logo_url as airline_logo,
          orig.code as origin_code,
          orig.name_en as origin_name_en,
          orig.name_fa as origin_name_fa,
          orig.city_name_en as origin_city_en,
          orig.city_name_fa as origin_city_fa,
          dest.code as destination_code,
          dest.name_en as destination_name_en,
          dest.name_fa as destination_name_fa,
          dest.city_name_en as destination_city_en,
          dest.city_name_fa as destination_city_fa,
          act.type_code as aircraft_code,
          act.type_name as aircraft_name
        FROM flights f
        LEFT JOIN airlines a ON f.airline_id = a.id
        LEFT JOIN airports orig ON f.origin_airport_id = orig.id
        LEFT JOIN airports dest ON f.destination_airport_id = dest.id
        LEFT JOIN aircraft_types act ON f.aircraft_type_id = act.id
        WHERE f.base_flight_id = $1
      `;
      const result = await this.postgres.queryOne(query, [baseFlightId]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting flight by base ID: ${error}`);
      throw error;
    }
  }

  /**
   * Get latest snapshot for a flight
   */
  async getLatestFlightSnapshot(baseFlightId: string): Promise<any> {
    try {
      const query = `
        SELECT fs.*
        FROM flight_snapshots fs
        JOIN flights f ON fs.flight_id = f.id
        WHERE f.base_flight_id = $1
        ORDER BY fs.scraped_at DESC
        LIMIT 1
      `;
      const result = await this.postgres.queryOne(query, [baseFlightId]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting latest snapshot: ${error}`);
      throw error;
    }
  }

  /**
   * Get all snapshots for a flight in a time range
   */
  async getFlightSnapshots(
    baseFlightId: string,
    hoursBack: number = 24,
  ): Promise<any[]> {
    try {
      const query = `
        SELECT fs.*
        FROM flight_snapshots fs
        JOIN flights f ON fs.flight_id = f.id
        WHERE f.base_flight_id = $1
          AND fs.scraped_at > NOW() - INTERVAL '${hoursBack} hours'
        ORDER BY fs.scraped_at DESC
      `;
      const result = await this.postgres.queryMany(query, [baseFlightId]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting flight snapshots: ${error}`);
      throw error;
    }
  }
}
