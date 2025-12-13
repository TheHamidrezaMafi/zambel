import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { TrackedFlight } from '../models/tracked-flight.entity';
import { FlightPriceHistory } from '../models/flight-price-history.entity';
import { LowestPriceSnapshot } from '../models/lowest-price-snapshot.entity';
import { RouteConfig } from '../models/route-config.entity';
import { FlightPriceQueryDto, PriceStatisticsDto } from '../dto/flight-tracking.dto';

@Injectable()
export class FlightTrackingService {
  private readonly logger = new Logger(FlightTrackingService.name);

  constructor(
    @InjectRepository(TrackedFlight)
    private trackedFlightRepository: Repository<TrackedFlight>,
    @InjectRepository(FlightPriceHistory)
    private priceHistoryRepository: Repository<FlightPriceHistory>,
    @InjectRepository(LowestPriceSnapshot)
    private lowestPriceSnapshotRepository: Repository<LowestPriceSnapshot>,
    @InjectRepository(RouteConfig)
    private routeConfigRepository: Repository<RouteConfig>,
  ) {}

  /**
   * Create or update a tracked flight
   * This method ensures we don't duplicate flights
   */
  async upsertTrackedFlight(flightData: {
    flight_number: string;
    flight_date: Date;
    origin: string;
    destination: string;
    airline_name_fa?: string;
    airline_name_en?: string;
    departure_time?: Date;
    arrival_time?: Date;
    metadata?: any;
  }): Promise<TrackedFlight> {
    // Check if flight already exists
    let trackedFlight = await this.trackedFlightRepository.findOne({
      where: {
        flight_number: flightData.flight_number,
        flight_date: flightData.flight_date,
        origin: flightData.origin,
        destination: flightData.destination,
      },
    });

    if (trackedFlight) {
      // Update existing flight
      trackedFlight.airline_name_fa = flightData.airline_name_fa || trackedFlight.airline_name_fa;
      trackedFlight.airline_name_en = flightData.airline_name_en || trackedFlight.airline_name_en;
      trackedFlight.departure_time = flightData.departure_time || trackedFlight.departure_time;
      trackedFlight.arrival_time = flightData.arrival_time || trackedFlight.arrival_time;
      trackedFlight.last_tracked_at = new Date();
      trackedFlight.metadata = { ...trackedFlight.metadata, ...flightData.metadata };
    } else {
      // Create new flight
      trackedFlight = this.trackedFlightRepository.create({
        ...flightData,
        last_tracked_at: new Date(),
      });
    }

    return await this.trackedFlightRepository.save(trackedFlight);
  }

  /**
   * Add price history for a tracked flight
   * Calculates price change from previous record
   */
  async addPriceHistory(
    trackedFlightId: string,
    priceData: {
      provider: string;
      adult_price: number;
      child_price?: number;
      infant_price?: number;
      available_seats?: number;
      is_available?: boolean;
      raw_data?: any;
    },
  ): Promise<FlightPriceHistory> {
    // Get the last price record for comparison
    const lastPrice = await this.priceHistoryRepository.findOne({
      where: { tracked_flight_id: trackedFlightId, provider: priceData.provider },
      order: { scraped_at: 'DESC' },
    });

    let priceChangePercentage: number | null = null;
    let priceChangeAmount: number | null = null;

    if (lastPrice) {
      priceChangeAmount = Number(priceData.adult_price) - Number(lastPrice.adult_price);
      priceChangePercentage = (priceChangeAmount / Number(lastPrice.adult_price)) * 100;
    }

    const priceHistory = this.priceHistoryRepository.create({
      tracked_flight_id: trackedFlightId,
      provider: priceData.provider,
      adult_price: priceData.adult_price,
      child_price: priceData.child_price,
      infant_price: priceData.infant_price,
      available_seats: priceData.available_seats,
      is_available: priceData.is_available ?? true,
      raw_data: priceData.raw_data,
      price_change_percentage: priceChangePercentage,
      price_change_amount: priceChangeAmount,
    });

    return await this.priceHistoryRepository.save(priceHistory);
  }

  /**
   * Process and store scraped flight data
   * This is the main entry point for adding scraped data
   * Returns the tracked flight ID
   */
  async processScrapedFlight(flightData: any): Promise<string> {
    try {
      // Normalize flight data
      const normalizedFlightNumber = this.normalizeFlightNumber(flightData.flight_number);
      const flightDate = new Date(flightData.departure_date_time);
      flightDate.setHours(0, 0, 0, 0); // Set to start of day

      // Create or update tracked flight
      const trackedFlight = await this.upsertTrackedFlight({
        flight_number: normalizedFlightNumber,
        flight_date: flightDate,
        origin: flightData.origin,
        destination: flightData.destination,
        airline_name_fa: flightData.airline_name_fa,
        airline_name_en: flightData.airline_name_en,
        departure_time: new Date(flightData.departure_date_time),
        arrival_time: new Date(flightData.arrival_date_time),
        metadata: {
          original_flight_number: flightData.flight_number,
        },
      });

      // Add price history
      await this.addPriceHistory(trackedFlight.id, {
        provider: flightData.provider_name,
        adult_price: Number(flightData.adult_price),
        available_seats: flightData.capacity,
        is_available: true,
        raw_data: {
          rules: flightData.rules,
          capacity: flightData.capacity,
          departure_date_time: flightData.departure_date_time,
          arrival_date_time: flightData.arrival_date_time,
        },
      });

      this.logger.log(
        `Tracked flight ${normalizedFlightNumber} on ${flightDate.toISOString().split('T')[0]} - ${flightData.provider_name}: ${flightData.adult_price}`,
      );

      return trackedFlight.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing scraped flight: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Query flight price history with filters
   */
  async queryFlightPrices(query: FlightPriceQueryDto) {
    const {
      origin,
      destination,
      start_date,
      end_date,
      flight_number,
      provider,
      min_price,
      max_price,
      limit = 50,
      page = 1,
    } = query;

    const queryBuilder = this.trackedFlightRepository
      .createQueryBuilder('flight')
      .leftJoinAndSelect('flight.price_history', 'history')
      .orderBy('flight.flight_date', 'DESC')
      .addOrderBy('history.scraped_at', 'DESC');

    if (origin) {
      queryBuilder.andWhere('flight.origin = :origin', { origin });
    }

    if (destination) {
      queryBuilder.andWhere('flight.destination = :destination', { destination });
    }

    if (flight_number) {
      queryBuilder.andWhere('flight.flight_number = :flight_number', { flight_number });
    }

    if (start_date) {
      queryBuilder.andWhere('flight.flight_date >= :start_date', { start_date });
    }

    if (end_date) {
      queryBuilder.andWhere('flight.flight_date <= :end_date', { end_date });
    }

    if (provider) {
      queryBuilder.andWhere('history.provider = :provider', { provider });
    }

    if (min_price !== undefined) {
      queryBuilder.andWhere('history.adult_price >= :min_price', { min_price });
    }

    if (max_price !== undefined) {
      queryBuilder.andWhere('history.adult_price <= :max_price', { max_price });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [flights, total] = await queryBuilder.getManyAndCount();

    return {
      data: flights,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get price statistics for a specific flight
   */
  async getFlightPriceStatistics(
    flightNumber: string,
    flightDate: Date,
    origin: string,
    destination: string,
  ): Promise<any> {
    const flight = await this.trackedFlightRepository.findOne({
      where: { flight_number: flightNumber, flight_date: flightDate, origin, destination },
      relations: ['price_history'],
      order: {
        price_history: {
          scraped_at: 'ASC',
        },
      },
    });

    if (!flight || !flight.price_history || flight.price_history.length === 0) {
      return null;
    }

    const prices = flight.price_history.map((h) => Number(h.adult_price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const currentPrice = Number(flight.price_history[flight.price_history.length - 1].adult_price);
    const firstPrice = Number(flight.price_history[0].adult_price);
    const totalChangePercentage = ((currentPrice - firstPrice) / firstPrice) * 100;

    return {
      flight_number: flight.flight_number,
      flight_date: flight.flight_date,
      origin: flight.origin,
      destination: flight.destination,
      price_history: flight.price_history.map(h => ({
        scraped_at: h.scraped_at,
        adult_price: Number(h.adult_price),
        provider: h.provider,
        available_seats: h.available_seats,
        is_available: h.is_available,
      })),
      statistics: {
        current_price: currentPrice,
        lowest_price: minPrice,
        highest_price: maxPrice,
        average_price: Math.round(avgPrice),
        price_drop_percentage: Number(totalChangePercentage.toFixed(2)),
      },
    };
  }

  /**
   * Get all active route configurations
   */
  async getActiveRouteConfigs(): Promise<RouteConfig[]> {
    return await this.routeConfigRepository.find({
      where: { is_active: true },
    });
  }

  /**
   * Create or update route configuration
   */
  async upsertRouteConfig(configData: Partial<RouteConfig>): Promise<RouteConfig> {
    let config = await this.routeConfigRepository.findOne({
      where: { origin: configData.origin, destination: configData.destination },
    });

    if (config) {
      Object.assign(config, configData);
    } else {
      config = this.routeConfigRepository.create(configData);
    }

    return await this.routeConfigRepository.save(config);
  }

  /**
   * Normalize flight number (same logic as scraper service)
   */
  private normalizeFlightNumber(flightNumber: string): string {
    if (!flightNumber) return flightNumber;

    const numericPart = flightNumber.replace(/[A-Za-z]/g, '');
    const withoutLeadingZeros = numericPart.replace(/^0+/, '') || '0';

    if (withoutLeadingZeros.length === 5 && withoutLeadingZeros[0] >= '1' && withoutLeadingZeros[0] <= '9') {
      return withoutLeadingZeros.slice(1).replace(/^0+/, '') || '0';
    }

    if (withoutLeadingZeros.length === 4 && withoutLeadingZeros[0] === '9') {
      const result = withoutLeadingZeros.slice(1).replace(/^0+/, '') || '0';
      if (result.length === 3) {
        return result;
      }
    }

    return withoutLeadingZeros;
  }

  /**
   * Update route config last tracked time
   */
  async updateRouteLastTracked(routeConfigId: string): Promise<void> {
    await this.routeConfigRepository.update(routeConfigId, {
      last_tracked_at: new Date(),
    });
  }

  /**
   * Calculate and store the lowest price for a tracking cycle
   * Call this after all providers have been scraped for a flight
   */
  async calculateAndStoreLowestPrice(
    trackedFlightId: string,
    providersData: Array<{ provider: string; price: number }>,
  ): Promise<void> {
    if (!providersData || providersData.length === 0) {
      return;
    }

    // Filter out zero or invalid prices
    const validPrices = providersData.filter(p => p.price && p.price > 0);
    
    if (validPrices.length === 0) {
      this.logger.warn(`No valid prices found for flight ${trackedFlightId}`);
      return;
    }

    // Sort by price to find lowest
    const sorted = [...validPrices].sort((a, b) => a.price - b.price);
    const lowest = sorted[0];
    const secondLowest = sorted[1];

    // Get previous lowest price snapshot
    const previousSnapshot = await this.lowestPriceSnapshotRepository.findOne({
      where: { tracked_flight_id: trackedFlightId },
      order: { scraped_at: 'DESC' },
    });

    // Calculate change from previous
    let priceChangePercentage: number | null = null;
    let priceChangeAmount: number | null = null;

    if (previousSnapshot) {
      priceChangeAmount = lowest.price - Number(previousSnapshot.lowest_price);
      priceChangePercentage = (priceChangeAmount / Number(previousSnapshot.lowest_price)) * 100;
    }

    // Create new snapshot
    const snapshot = this.lowestPriceSnapshotRepository.create({
      tracked_flight_id: trackedFlightId,
      lowest_price: lowest.price,
      provider: lowest.provider,
      price_change_percentage: priceChangePercentage,
      price_change_amount: priceChangeAmount,
      comparison_data: {
        all_providers_prices: validPrices,
        second_lowest_price: secondLowest?.price,
        second_lowest_provider: secondLowest?.provider,
        price_difference_from_second: secondLowest ? lowest.price - secondLowest.price : null,
      },
    });

    await this.lowestPriceSnapshotRepository.save(snapshot);

    // Update tracked flight with current lowest price
    await this.trackedFlightRepository.update(trackedFlightId, {
      current_lowest_price: lowest.price,
      current_lowest_price_provider: lowest.provider,
      current_lowest_price_updated_at: new Date(),
    });

    this.logger.log(
      `Lowest price for flight ${trackedFlightId}: ${lowest.price} from ${lowest.provider}`,
    );
  }

  /**
   * Get lowest price history for a flight
   */
  async getLowestPriceHistory(
    flightNumber: string,
    flightDate: Date,
    origin: string,
    destination: string,
  ) {
    const flight = await this.trackedFlightRepository.findOne({
      where: { flight_number: flightNumber, flight_date: flightDate, origin, destination },
      relations: ['lowest_price_snapshots'],
    });

    if (!flight) {
      return null;
    }

    return {
      flight_number: flight.flight_number,
      flight_date: flight.flight_date,
      origin: flight.origin,
      destination: flight.destination,
      current_lowest_price: flight.current_lowest_price,
      current_lowest_price_provider: flight.current_lowest_price_provider,
      history: flight.lowest_price_snapshots?.sort((a, b) => 
        b.scraped_at.getTime() - a.scraped_at.getTime()
      ),
    };
  }

  /**
   * Get comprehensive price history grouped by provider for chart display
   */
  async getComprehensivePriceHistory(
    flightNumber: string,
    flightDate: Date,
    origin: string,
    destination: string,
  ) {
    const flight = await this.trackedFlightRepository.findOne({
      where: { flight_number: flightNumber, flight_date: flightDate, origin, destination },
      relations: ['price_history'],
      order: {
        price_history: {
          scraped_at: 'ASC',
        },
      },
    });

    if (!flight || !flight.price_history || flight.price_history.length === 0) {
      return null;
    }

    // Group price history by provider
    const providerData = new Map<string, any[]>();
    flight.price_history.forEach((history) => {
      if (!providerData.has(history.provider)) {
        providerData.set(history.provider, []);
      }
      providerData.get(history.provider)!.push({
        timestamp: history.scraped_at,
        price: Number(history.adult_price),
        available_seats: history.available_seats,
        is_available: history.is_available,
      });
    });

    // Calculate statistics per provider
    const providers = Array.from(providerData.entries()).map(([provider, data]) => {
      const prices = data.map(d => d.price);
      const latestPrice = data[data.length - 1];
      const firstPrice = data[0];

      return {
        provider,
        data_points: data,
        statistics: {
          min_price: Math.min(...prices),
          max_price: Math.max(...prices),
          avg_price: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
          current_price: latestPrice.price,
          first_price: firstPrice.price,
          price_change: latestPrice.price - firstPrice.price,
          price_change_percentage: ((latestPrice.price - firstPrice.price) / firstPrice.price) * 100,
          total_snapshots: data.length,
          latest_update: latestPrice.timestamp,
        },
      };
    });

    // Calculate overall statistics
    const allPrices = flight.price_history.map(h => Number(h.adult_price));
    const currentLowestProvider = providers.reduce((min, p) => 
      p.statistics.current_price < min.statistics.current_price ? p : min
    );

    return {
      flight_info: {
        flight_number: flight.flight_number,
        flight_date: flight.flight_date,
        origin: flight.origin,
        destination: flight.destination,
        airline_name_fa: flight.airline_name_fa,
        airline_name_en: flight.airline_name_en,
        departure_time: flight.departure_time,
        arrival_time: flight.arrival_time,
      },
      overall_statistics: {
        min_price: Math.min(...allPrices),
        max_price: Math.max(...allPrices),
        avg_price: Math.round(allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length),
        total_snapshots: flight.price_history.length,
        first_tracked: flight.price_history[0].scraped_at,
        last_tracked: flight.price_history[flight.price_history.length - 1].scraped_at,
        current_lowest_price: currentLowestProvider.statistics.current_price,
        current_lowest_provider: currentLowestProvider.provider,
      },
      providers,
    };
  }

  /**
   * Get price trends for a route
   */
  async getRoutePriceTrends(origin: string, destination: string, daysAhead: number = 7) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);
    endDate.setHours(23, 59, 59, 999);

    const flights = await this.trackedFlightRepository.find({
      where: {
        origin,
        destination,
        flight_date: Between(startDate, endDate),
      },
      relations: ['price_history'],
      order: { flight_date: 'ASC' },
    });

    return flights.map((flight) => {
      const latestPrices = flight.price_history
        .sort((a, b) => b.scraped_at.getTime() - a.scraped_at.getTime())
        .slice(0, 5);

      return {
        flight_number: flight.flight_number,
        flight_date: flight.flight_date,
        departure_time: flight.departure_time,
        airline_name_fa: flight.airline_name_fa,
        current_price: latestPrices[0]?.adult_price || null,
        current_lowest_price: flight.current_lowest_price,
        current_lowest_price_provider: flight.current_lowest_price_provider,
        price_history_count: flight.price_history.length,
        latest_prices: latestPrices,
      };
    });
  }
}
