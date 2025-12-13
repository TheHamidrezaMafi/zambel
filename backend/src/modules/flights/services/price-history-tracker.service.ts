import { Injectable, Logger } from '@nestjs/common';
import { FlightDatabaseRepository } from '../repositories/flight-database.repository';
import { PostgresService } from 'src/core/database/postgres.service';
import { UnifiedFlight } from '../../scraper/interfaces/unified-flight.interface';

/**
 * Price History Tracker Service
 * Handles recording flight price history for search queries
 * 
 * Workflow:
 * 1. When a user searches for a flight (origin, destination, date)
 * 2. Check if we have a record from the last hour for that route/date
 * 3. If not, save the current search results to database
 * 4. This allows us to show price history when users search later
 */
@Injectable()
export class PriceHistoryTrackerService {
  private readonly logger = new Logger(PriceHistoryTrackerService.name);
  private readonly CACHE_DURATION_MINUTES = 60; // 1 hour

  constructor(
    private readonly flightDatabase: FlightDatabaseRepository,
    private readonly postgres: PostgresService,
  ) {}

  /**
   * Record price history for flights from a search
   * Checks if data was already saved in the last hour before saving
   * 
   * @param flights - Array of unified flights from scraper
   * @param origin - Origin airport code
   * @param destination - Destination airport code
   * @param flightDate - Date of the flight
   * @returns Promise with number of records saved
   */
  async recordSearchResults(
    flights: UnifiedFlight[],
    origin: string,
    destination: string,
    flightDate: string,
  ): Promise<{ saved: number; skipped: number }> {
    if (!flights || flights.length === 0) {
      return { saved: 0, skipped: 0 };
    }

    try {
      this.logger.debug(
        `Recording price history for ${origin}->${destination} on ${flightDate}, ${flights.length} flights`,
      );

      let savedCount = 0;
      let skippedCount = 0;

      // Process each flight
      for (const flight of flights) {
        const saved = await this.recordFlightPriceHistory(flight, flightDate);
        if (saved) {
          savedCount++;
        } else {
          skippedCount++;
        }
      }

      this.logger.log(
        `Price history recording completed: ${savedCount} saved, ${skippedCount} skipped`,
      );

      return { saved: savedCount, skipped: skippedCount };
    } catch (error) {
      this.logger.error(
        `Error recording price history: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { saved: 0, skipped: 0 };
    }
  }

  /**
   * Record a single flight's price history
   * Only saves if no record exists from the last hour
   * 
   * @param flight - Unified flight object
   * @param flightDate - Date of the flight
   * @returns True if saved, false if skipped
   */
  private async recordFlightPriceHistory(
    flight: UnifiedFlight,
    flightDate: string,
  ): Promise<boolean> {
    try {
      // Validate flight data
      if (!this.isValidFlight(flight)) {
        this.logger.debug(`Skipping invalid flight: ${flight.flight_id}`);
        return false;
      }

      const trackedFlightData = this.extractTrackedFlightData(flight, flightDate);
      const priceHistoryData = this.extractPriceHistoryData(flight);

      // Check if we already have a recent record for this flight
      const hasRecentRecord = await this.hasRecentRecord(
        trackedFlightData.flight_number,
        trackedFlightData.flight_date,
        trackedFlightData.origin,
        trackedFlightData.destination,
        flight.provider_source,
      );

      if (hasRecentRecord) {
        this.logger.debug(
          `Skipping ${flight.flight_number} - recent record exists`,
        );
        return false;
      }

      // Insert or update tracked flight
      const trackedFlightId = await this.upsertTrackedFlight(trackedFlightData);

      // Insert price history record
      await this.insertPriceHistory(trackedFlightId, priceHistoryData);

      return true;
    } catch (error) {
      this.logger.error(
        `Error recording flight ${flight.flight_id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Check if a recent record exists for this flight/provider combination
   * Returns true if a record exists from the last hour
   */
  private async hasRecentRecord(
    flightNumber: string,
    flightDate: string,
    origin: string,
    destination: string,
    provider: string,
  ): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM flight_price_history fph
        INNER JOIN tracked_flights tf ON tf.id = fph.tracked_flight_id
        WHERE tf.flight_number = $1
          AND tf.flight_date = $2
          AND tf.origin = $3
          AND tf.destination = $4
          AND fph.provider = $5
          AND fph.scraped_at > NOW() - INTERVAL '1 hour'
        LIMIT 1
      `;

      const result = await this.postgres.queryOne<{ count: number }>(query, [
        flightNumber,
        flightDate,
        origin,
        destination,
        provider,
      ]);

      return (result?.count || 0) > 0;
    } catch (error) {
      this.logger.warn(
        `Error checking for recent record: ${error instanceof Error ? error.message : String(error)}`,
      );
      // On error, assume no recent record exists to be safe
      return false;
    }
  }

  /**
   * Insert or update tracked flight record
   * Returns the tracked_flight_id
   */
  private async upsertTrackedFlight(data: {
    flight_number: string;
    flight_date: string;
    origin: string;
    destination: string;
    airline_name_fa?: string;
    airline_name_en?: string;
    departure_time?: string;
    arrival_time?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO tracked_flights (
        flight_number, flight_date, origin, destination,
        airline_name_fa, airline_name_en, departure_time, arrival_time,
        created_at, last_tracked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (flight_number, flight_date, origin, destination) 
      DO UPDATE SET last_tracked_at = NOW()
      RETURNING id
    `;

    const result = await this.postgres.queryOne<{ id: string }>(query, [
      data.flight_number,
      data.flight_date,
      data.origin,
      data.destination,
      data.airline_name_fa || null,
      data.airline_name_en || null,
      data.departure_time || null,
      data.arrival_time || null,
    ]);

    if (!result?.id) {
      throw new Error('Failed to insert tracked flight');
    }

    return result.id;
  }

  /**
   * Insert price history record
   */
  private async insertPriceHistory(
    trackedFlightId: string,
    data: {
      provider: string;
      adult_price: number;
      child_price?: number;
      infant_price?: number;
      capacity: number;
      is_available: boolean;
      raw_data?: any;
    },
  ): Promise<void> {
    const query = `
      INSERT INTO flight_price_history (
        tracked_flight_id, provider, adult_price, child_price, infant_price,
        available_seats, is_available, raw_data, scraped_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;

    await this.postgres.query(query, [
      trackedFlightId,
      data.provider,
      data.adult_price,
      data.child_price || null,
      data.infant_price || null,
      data.capacity,
      data.is_available,
      data.raw_data ? JSON.stringify(data.raw_data) : null,
    ]);
  }

  /**
   * Extract tracked flight data from unified flight
   */
  private extractTrackedFlightData(
    flight: UnifiedFlight,
    flightDate: string,
  ): {
    flight_number: string;
    flight_date: string;
    origin: string;
    destination: string;
    airline_name_fa?: string;
    airline_name_en?: string;
    departure_time?: string;
    arrival_time?: string;
  } {
    return {
      flight_number: flight.flight_number || '',
      flight_date: flightDate,
      origin: flight.route.origin.airport_code,
      destination: flight.route.destination.airport_code,
      airline_name_fa: flight.airline.name_fa,
      airline_name_en: flight.airline.name_en,
      departure_time: flight.schedule.departure_datetime,
      arrival_time: flight.schedule.arrival_datetime,
    };
  }

  /**
   * Extract price history data from unified flight
   */
  private extractPriceHistoryData(flight: UnifiedFlight): {
    provider: string;
    adult_price: number;
    child_price?: number;
    infant_price?: number;
    capacity: number;
    is_available: boolean;
    raw_data?: any;
  } {
    return {
      provider: flight.provider_source,
      adult_price: flight.pricing.adult.total_fare,
      child_price: flight.pricing.child?.total_fare,
      infant_price: flight.pricing.infant?.total_fare,
      capacity: flight.ticket_info.capacity,
      is_available: flight.ticket_info.reservable,
      raw_data: {
        flight_id: flight.flight_id,
        original_id: flight.metadata.original_id,
        cabin_class: flight.cabin.class,
        is_charter: flight.ticket_info.is_charter,
        is_refundable: flight.ticket_info.is_refundable,
        departure_time: flight.schedule.departure_datetime,
        arrival_time: flight.schedule.arrival_datetime,
      },
    };
  }

  /**
   * Validate that flight has required data for tracking
   */
  private isValidFlight(flight: UnifiedFlight): boolean {
    return Boolean(
      flight &&
      flight.flight_number &&
      flight.route?.origin?.airport_code &&
      flight.route?.destination?.airport_code &&
      flight.pricing?.adult?.total_fare &&
      flight.ticket_info?.capacity &&
      flight.provider_source
    );
  }

  /**
   * Get cache age in minutes for a route/date combination
   * Returns the age of the most recent record, or -1 if no records exist
   */
  async getCacheAge(
    origin: string,
    destination: string,
    flightDate: string,
  ): Promise<number> {
    try {
      const query = `
        SELECT 
          EXTRACT(EPOCH FROM (NOW() - MAX(fph.scraped_at))) / 60 as age_minutes
        FROM flight_price_history fph
        INNER JOIN tracked_flights tf ON tf.id = fph.tracked_flight_id
        WHERE tf.origin = $1
          AND tf.destination = $2
          AND tf.flight_date = $3
      `;

      const result = await this.postgres.queryOne<{ age_minutes: number | null }>(
        query,
        [origin, destination, flightDate],
      );

      return result?.age_minutes ? Math.round(result.age_minutes) : -1;
    } catch (error) {
      this.logger.warn(`Error getting cache age: ${error}`);
      return -1;
    }
  }

  /**
   * Batch record search results - for efficiency when processing multiple routes
   */
  async recordBatchSearchResults(
    searchResults: Array<{
      flights: UnifiedFlight[];
      origin: string;
      destination: string;
      flightDate: string;
    }>,
  ): Promise<{ total_saved: number; total_skipped: number }> {
    let totalSaved = 0;
    let totalSkipped = 0;

    for (const result of searchResults) {
      const { saved, skipped } = await this.recordSearchResults(
        result.flights,
        result.origin,
        result.destination,
        result.flightDate,
      );
      totalSaved += saved;
      totalSkipped += skipped;
    }

    return { total_saved: totalSaved, total_skipped: totalSkipped };
  }
}
