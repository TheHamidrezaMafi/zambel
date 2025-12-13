import { Injectable, Logger } from '@nestjs/common';
import { ScraperHttpService } from '../../scraper/services/scraper-http.service';
import { PriceHistoryTrackerService } from './price-history-tracker.service';
import {
  UnifiedFlight,
  ScraperUnifiedResponse,
} from '../../scraper/interfaces/unified-flight.interface';
import * as fs from 'fs';
import * as path from 'path';

export interface GroupedFlight {
  base_flight_id: string;
  flight_number: string;
  airline: {
    code: string;
    name_fa: string;
    name_en: string;
    logo_url?: string;
  };
  route: {
    origin: string;
    destination: string;
    origin_city_fa: string;
    destination_city_fa: string;
    origin_terminal?: string;
    destination_terminal?: string;
  };
  schedule: {
    departure_datetime: string;
    arrival_datetime: string;
    duration_minutes: number;
    stops: number;
  };
  lowestPrice: number;
  highestPrice: number;
  availableProviders: number;
  pricingOptions: PricingOption[];
}

export interface PricingOption {
  flight_id: string;
  provider: string;
  price: number;
  cabin_class: string;
  cabin_class_fa: string;
  capacity: number;
  is_refundable: boolean;
  is_charter: boolean;
  cabin: string;
  ticket_type: string;
  baggage_kg?: number;
  booking_class?: string;
  original_id: string;
}

export interface AggregatedSearchResult {
  flights: GroupedFlight[];
  metadata: {
    total_flights: number;
    total_options: number;
    providers_queried: string[];
    providers_successful: string[];
    providers_failed: string[];
    search_time_ms: number;
    cached: boolean;
  };
}

@Injectable()
export class FlightAggregationService {
  private readonly logger = new Logger(FlightAggregationService.name);
  private logoMap: Record<string, string> = {};

  constructor(
    private readonly scraperHttpService: ScraperHttpService,
    private readonly priceHistoryTracker: PriceHistoryTrackerService,
  ) {
    this.loadLogoMap();
  }

  /**
   * Load airline logo map from local assets
   */
  private loadLogoMap() {
    try {
      const possiblePaths = [
        path.join(__dirname, '../../../assets/logos/logo-map.json'),
        path.join(__dirname, '../../../../assets/logos/logo-map.json'),
        path.join(process.cwd(), 'dist/assets/logos/logo-map.json'),
        path.join(process.cwd(), 'src/assets/logos/logo-map.json'),
      ];

      for (const logoMapPath of possiblePaths) {
        if (fs.existsSync(logoMapPath)) {
          this.logoMap = JSON.parse(fs.readFileSync(logoMapPath, 'utf-8'));
          this.logger.log(`✅ Loaded ${Object.keys(this.logoMap).length} airline logos from: ${logoMapPath}`);
          return;
        }
      }
      this.logger.warn('⚠️ Logo map file not found in any expected location');
    } catch (error) {
      this.logger.warn('⚠️ Could not load logo map, will use scraper URLs:', error);
    }
  }

  /**
   * Get local logo URL for an airline
   */
  private getLogoUrl(airlineCode: string, fallbackUrl?: string): string {
    if (airlineCode && this.logoMap[airlineCode]) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
      const relativePath = this.logoMap[airlineCode].replace('./', '/');
      return `${backendUrl}${relativePath}`;
    }
    return fallbackUrl || '';
  }

  /**
   * Search flights across all providers and group by base_flight_id
   * Automatically records price history for future reference
   */
  async searchFlights(
    origin: string,
    destination: string,
    date: string,
    returnDate?: string,
    userId: string = '1',
  ): Promise<AggregatedSearchResult> {
    const startTime = Date.now();

    // Get available providers
    const providers = await this.scraperHttpService.getAvailableProviders();
    this.logger.log(
      `Starting search: ${origin} → ${destination} on ${date}`,
    );
    this.logger.log(`Querying ${providers.length} providers: ${providers.join(', ')}`);

    // Query all providers in parallel
    const responseMap = await this.scraperHttpService.queryAllUnifiedProviders(
      providers,
      origin,
      destination,
      date,
      returnDate,
      userId,
    );

    // Track successful and failed providers
    const providersSuccessful: string[] = [];
    const providersFailed: string[] = [];
    const allFlights: UnifiedFlight[] = []; // Collect all flights for price history recording

    responseMap.forEach((response, provider) => {
      if (response.flights && response.flights.length > 0) {
        providersSuccessful.push(provider);
        // Collect flights for price history tracking
        allFlights.push(...response.flights);
      } else {
        providersFailed.push(provider);
      }
    });

    // Aggregate and group flights
    const groupedFlights = this.aggregateFlights(responseMap);

    const searchTimeMs = Date.now() - startTime;

    const totalOptions = groupedFlights.reduce(
      (sum, flight) => sum + flight.pricingOptions.length,
      0,
    );

    this.logger.log(
      `Search completed in ${searchTimeMs}ms: ${groupedFlights.length} unique flights, ${totalOptions} pricing options`,
    );
    this.logger.log(
      `Successful providers: ${providersSuccessful.join(', ') || 'none'}`,
    );
    if (providersFailed.length > 0) {
      this.logger.warn(`Failed providers: ${providersFailed.join(', ')}`);
    }

    // Record price history asynchronously (don't wait for it to complete)
    // This ensures the search response is returned quickly while data is saved in the background
    this.recordPriceHistoryAsync(allFlights, origin, destination, date);

    return {
      flights: groupedFlights,
      metadata: {
        total_flights: groupedFlights.length,
        total_options: totalOptions,
        providers_queried: providers,
        providers_successful: providersSuccessful,
        providers_failed: providersFailed,
        search_time_ms: searchTimeMs,
        cached: false,
      },
    };
  }

  /**
   * Record price history asynchronously in the background
   * This method doesn't block the search response
   */
  private recordPriceHistoryAsync(
    flights: UnifiedFlight[],
    origin: string,
    destination: string,
    date: string,
  ): void {
    // Use setImmediate or setTimeout to run after response is sent
    setImmediate(async () => {
      try {
        const result = await this.priceHistoryTracker.recordSearchResults(
          flights,
          origin,
          destination,
          date,
        );
        
        this.logger.debug(
          `Price history recorded: ${result.saved} saved, ${result.skipped} skipped`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to record price history: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Don't throw - this is a non-critical background task
      }
    });
  }

  /**
   * Aggregate flights from multiple providers and group by base_flight_id
   */
  private aggregateFlights(
    responseMap: Map<string, ScraperUnifiedResponse>,
  ): GroupedFlight[] {
    const flightGroups = new Map<string, UnifiedFlight[]>();

    // Group flights by base_flight_id
    responseMap.forEach((response, provider) => {
      if (!response.flights || response.flights.length === 0) {
        return;
      }

      response.flights.forEach((flight: UnifiedFlight) => {
        const baseId = flight.base_flight_id;
        if (!baseId) {
          this.logger.warn(
            `Flight without base_flight_id from ${provider}: ${flight.flight_id}`,
          );
          return;
        }

        if (!flightGroups.has(baseId)) {
          flightGroups.set(baseId, []);
        }
        flightGroups.get(baseId).push(flight);
      });
    });

    this.logger.log(
      `Grouped into ${flightGroups.size} unique flights from ${responseMap.size} providers`,
    );

    // Convert groups to GroupedFlight format
    const groupedFlights: GroupedFlight[] = [];

    flightGroups.forEach((flights, baseId) => {
      // Use first flight as template for common data
      const template = flights[0];

      // Extract pricing options from all flights in group
      // Filter out flights with price of 0 or capacity of 0
      const pricingOptions: PricingOption[] = flights
        .filter((flight) => {
          const price = flight.pricing.adult.total_fare;
          const capacity = flight.ticket_info.capacity;
          
          // Filter out invalid flights
          if (price <= 0) {
            this.logger.debug(`Filtering out flight ${flight.flight_id} from ${flight.provider_source}: price is ${price}`);
            return false;
          }
          if (capacity <= 0) {
            this.logger.debug(`Filtering out flight ${flight.flight_id} from ${flight.provider_source}: capacity is ${capacity}`);
            return false;
          }
          return true;
        })
        .map((flight) => ({
          flight_id: flight.flight_id,
          provider: flight.provider_source,
          price: flight.pricing.adult.total_fare,
          cabin_class: flight.cabin.class,
          cabin_class_fa: flight.cabin.class_display_name_fa,
          capacity: flight.ticket_info.capacity,
          is_refundable: flight.ticket_info.is_refundable,
          is_charter: flight.ticket_info.is_charter,
          cabin: this.mapCabinClass(flight.cabin.class),
          ticket_type: flight.ticket_info.type,
          baggage_kg: flight.baggage?.checked?.adult_kg,
          booking_class: flight.cabin.booking_class,
          original_id: flight.metadata.original_id,
        }));

      // Skip this flight group if no valid pricing options remain
      if (pricingOptions.length === 0) {
        this.logger.debug(`Skipping flight group ${baseId}: no valid pricing options after filtering`);
        return;
      }

      // Sort pricing options by price (lowest first)
      pricingOptions.sort((a, b) => a.price - b.price);

      // Get unique providers
      const uniqueProviders = new Set(flights.map((f) => f.provider_source));

      // Calculate price range
      const prices = pricingOptions.map((opt) => opt.price);
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);

      groupedFlights.push({
        base_flight_id: baseId,
        flight_number: template.flight_number,
        airline: {
          code: template.airline.code,
          name_fa: template.airline.name_fa,
          name_en: template.airline.name_en,
          logo_url: this.getLogoUrl(template.airline.code, template.airline.logo_url),
        },
        route: {
          origin: template.route.origin.airport_code,
          destination: template.route.destination.airport_code,
          origin_city_fa: template.route.origin.city_name_fa,
          destination_city_fa: template.route.destination.city_name_fa,
          origin_terminal: template.route.origin.terminal,
          destination_terminal: template.route.destination.terminal,
        },
        schedule: {
          departure_datetime: template.schedule.departure_datetime,
          arrival_datetime: template.schedule.arrival_datetime,
          duration_minutes: template.schedule.duration_minutes,
          stops: template.schedule.stops,
        },
        lowestPrice,
        highestPrice,
        availableProviders: uniqueProviders.size,
        pricingOptions,
      });
    });

    // Sort flights by departure time
    groupedFlights.sort((a, b) => {
      const timeA = new Date(a.schedule.departure_datetime).getTime();
      const timeB = new Date(b.schedule.departure_datetime).getTime();
      return timeA - timeB;
    });

    return groupedFlights;
  }

  /**
   * Map cabin class to single character code
   */
  private mapCabinClass(cabinClass: string): string {
    const mapping: Record<string, string> = {
      economy: 'E',
      business: 'B',
      first: 'F',
      premium_economy: 'P',
    };
    return mapping[cabinClass.toLowerCase()] || 'E';
  }

  /**
   * Get flight details by base_flight_id
   */
  async getFlightDetails(
    baseFlightId: string,
    searchResults: AggregatedSearchResult,
  ): Promise<GroupedFlight | null> {
    const flight = searchResults.flights.find(
      (f) => f.base_flight_id === baseFlightId,
    );
    return flight || null;
  }

  /**
   * Filter flights by price range
   */
  filterByPriceRange(
    flights: GroupedFlight[],
    minPrice?: number,
    maxPrice?: number,
  ): GroupedFlight[] {
    return flights.filter((flight) => {
      if (minPrice !== undefined && flight.lowestPrice < minPrice) {
        return false;
      }
      if (maxPrice !== undefined && flight.lowestPrice > maxPrice) {
        return false;
      }
      return true;
    });
  }

  /**
   * Filter flights by airline
   */
  filterByAirline(flights: GroupedFlight[], airlineCodes: string[]): GroupedFlight[] {
    if (!airlineCodes || airlineCodes.length === 0) {
      return flights;
    }
    return flights.filter((flight) =>
      airlineCodes.includes(flight.airline.code),
    );
  }

  /**
   * Filter flights by departure time range
   */
  filterByDepartureTime(
    flights: GroupedFlight[],
    startTime?: string, // HH:MM
    endTime?: string,   // HH:MM
  ): GroupedFlight[] {
    if (!startTime && !endTime) {
      return flights;
    }

    return flights.filter((flight) => {
      const departureTime = new Date(
        flight.schedule.departure_datetime,
      ).toTimeString().substring(0, 5);

      if (startTime && departureTime < startTime) {
        return false;
      }
      if (endTime && departureTime > endTime) {
        return false;
      }
      return true;
    });
  }

  /**
   * Sort flights by different criteria
   */
  sortFlights(
    flights: GroupedFlight[],
    sortBy: 'price' | 'departure' | 'duration' | 'providers',
    order: 'asc' | 'desc' = 'asc',
  ): GroupedFlight[] {
    const sorted = [...flights];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.lowestPrice - b.lowestPrice;
          break;
        case 'departure':
          comparison =
            new Date(a.schedule.departure_datetime).getTime() -
            new Date(b.schedule.departure_datetime).getTime();
          break;
        case 'duration':
          comparison = a.schedule.duration_minutes - b.schedule.duration_minutes;
          break;
        case 'providers':
          comparison = a.availableProviders - b.availableProviders;
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }
}
