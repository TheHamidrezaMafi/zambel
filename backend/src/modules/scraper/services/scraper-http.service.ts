import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import {
  ScraperUnifiedRequest,
  ScraperUnifiedResponse,
  UnifiedFlight,
} from '../interfaces/unified-flight.interface';

interface FlightRequest {
  requested_by_user_id: string;
  from_destination: string;
  to_destination: string;
  from_date: string;
  to_date: string;
  is_foreign_flight: boolean;
  type: string;
}

interface FlightSearchRequest {
  provider_name: string;
  requests: FlightRequest[];
}

interface FlightSearchResponse {
  flights: any[];
  total: number;
  provider: string;
  scrape_time_seconds: number;
}

@Injectable()
export class ScraperHttpService {
  private readonly logger = new Logger(ScraperHttpService.name);
  private readonly scraperBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Get scraper URL from environment or use default
    this.scraperBaseUrl = this.configService.get<string>(
      'SCRAPER_BASE_URL',
      'http://scraper:5000',
    );
    this.logger.log(`Scraper service URL: ${this.scraperBaseUrl}`);
  }

  /**
   * Normalize airline name to handle variations
   */
  private normalizeAirlineName(airlineName: string): string {
    if (!airlineName) return airlineName;

    const suffixesToRemove = [
      ' ایر',
      ' ایرلاین',
      ' ایرلاینز',
      ' airlines',
      ' airline',
      ' air',
      ' airways',
    ];

    let normalized = airlineName.trim();

    // Normalize Persian/Arabic character variations
    normalized = normalized
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[آأإٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ی');

    for (const suffix of suffixesToRemove) {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length).trim();
        break;
      }
    }

    return normalized;
  }

  /**
   * Normalize flight number
   */
  private normalizeFlightNumber(flightNumber: string): string {
    if (!flightNumber) return flightNumber;

    // Remove letters from the beginning
    let withoutLetters = flightNumber.replace(/^[A-Za-z]+/, '');

    // Remove leading zeros
    let withoutLeadingZeros = withoutLetters.replace(/^0+/, '');

    // If we removed too many digits, keep at least 3-4 digits
    if (withoutLeadingZeros.length < 3 && withoutLetters.length >= 4) {
      const digits = withoutLetters.match(/\d+/);
      if (digits && digits[0].length >= 4) {
        const result = digits[0].slice(-4);
        if (result.length === 3) {
          return result;
        }
      }
    }

    return withoutLeadingZeros;
  }

  /**
   * Normalize flight data
   */
  private normalizeFlightData(flights: any[]): any[] {
    return flights.map((flight) => {
      const normalizedNumber = this.normalizeFlightNumber(
        flight.flight_number || flight.flightNumber || '',
      );
      const normalizedAirline = this.normalizeAirlineName(
        flight.airline_name_fa || flight.airlineName || '',
      );

      return {
        ...flight,
        flight_number: normalizedNumber,
        original_flight_number: flight.flight_number || flight.flightNumber,
        airline_name_fa: normalizedAirline,
      };
    });
  }

  /**
   * Sort flights by departure time
   */
  private sortFlightsByDepartureTime(flights: any[]): any[] {
    return flights.sort((a, b) => {
      const dateA = new Date(
        a.departure_date_time || a.leaveDateTime,
      ).getTime();
      const dateB = new Date(
        b.departure_date_time || b.leaveDateTime,
      ).getTime();
      return dateA - dateB;
    });
  }

  /**
   * Call scraper REST API to get flights
   */
  async takeRequests(data: {
    provider_name: string;
    requests: any[];
  }): Promise<{ flights: any[] }> {
    const { requests, provider_name } = data;

    if (!requests || requests.length === 0) {
      return { flights: [] };
    }

    const request = requests[0];

    const requestBody: FlightSearchRequest = {
      provider_name: provider_name || '',
      requests: [
        {
          requested_by_user_id: request.requested_by_user_id || '1',
          from_destination: request.from_destination,
          to_destination: request.to_destination,
          from_date: request.from_date,
          to_date: request.to_date || '',
          is_foreign_flight:
            request.is_foreign_flight === true ||
            request.is_foreign_flight === 'true',
          type: request.type || '1',
        },
      ],
    };

    try {
      this.logger.log(
        `Scraping ${provider_name || 'all providers'}: ${request.from_destination} → ${request.to_destination} on ${request.from_date}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<FlightSearchResponse>(
          `${this.scraperBaseUrl}/scrape/flights`,
          requestBody,
          {
            timeout: 120000, // 2 minutes timeout
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const { flights, total, scrape_time_seconds } = response.data;

      this.logger.log(
        `Found ${total} flights in ${scrape_time_seconds}s from ${provider_name || 'all providers'}`,
      );

      if (flights && flights.length > 0) {
        let processedFlights = this.normalizeFlightData(flights);
        processedFlights = this.sortFlightsByDepartureTime(processedFlights);
        return { flights: processedFlights };
      }

      return { flights: [] };
    } catch (error: any) {
      this.logger.error('Scraper request failed:', error?.message || error);
      if (error?.response) {
        this.logger.error('Response status:', error.response.status);
        this.logger.error('Response data:', error.response.data);
      }
      return { flights: [] };
    }
  }

  /**
   * Health check for scraper service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.scraperBaseUrl}/health`, {
          timeout: 5000,
        }),
      );
      return response.status === 200;
    } catch (error: any) {
      this.logger.error('Scraper health check failed:', error?.message || error);
      return false;
    }
  }

  /**
   * Query a specific provider's unified endpoint
   */
  async queryUnifiedProvider(
    provider: string,
    origin: string,
    destination: string,
    date: string,
    returnDate?: string,
    userId: string = '1',
  ): Promise<ScraperUnifiedResponse> {
    const url = `${this.scraperBaseUrl}/unified/${provider}`;

    const requestBody: ScraperUnifiedRequest = {
      provider_name: provider,
      requests: [
        {
          from_destination: origin,
          to_destination: destination,
          from_date: date,
          to_date: returnDate || '',
          is_foreign_flight: false, // TODO: Determine based on airport data
          requested_by_user_id: userId,
          type: '1',
        },
      ],
    };

    try {
      this.logger.log(
        `Querying unified/${provider}: ${origin} → ${destination} on ${date}`,
      );

      const startTime = Date.now();
      const response = await firstValueFrom(
        this.httpService.post<UnifiedFlight[] | ScraperUnifiedResponse>(url, requestBody, {
          timeout: 30000, // 30 seconds per provider
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );

      const scrapeTime = (Date.now() - startTime) / 1000;

      // Handle both response formats: array or object with flights property
      let flights: UnifiedFlight[] = [];
      if (Array.isArray(response.data)) {
        flights = response.data;
      } else if (response.data && 'flights' in response.data) {
        flights = response.data.flights;
      }

      // Filter out flights with invalid price or capacity
      const originalCount = flights.length;
      flights = flights.filter((flight) => {
        const price = flight.pricing?.adult?.total_fare || 0;
        const capacity = flight.ticket_info?.capacity || 0;

        if (price <= 0) {
          this.logger.debug(
            `Filtering out flight ${flight.flight_id} from ${provider}: price is ${price}`,
          );
          return false;
        }
        if (capacity <= 0) {
          this.logger.debug(
            `Filtering out flight ${flight.flight_id} from ${provider}: capacity is ${capacity}`,
          );
          return false;
        }
        return true;
      });

      if (originalCount !== flights.length) {
        this.logger.log(
          `Filtered out ${originalCount - flights.length} invalid flights from ${provider} (price=0 or capacity=0)`,
        );
      }

      this.logger.log(
        `Provider ${provider} returned ${flights.length} valid flights in ${scrapeTime.toFixed(2)}s`,
      );

      return {
        flights,
        total: flights.length,
        provider,
        format: 'unified',
        scrape_time_seconds: scrapeTime,
      };
    } catch (error: any) {
      this.logger.error(
        `Error querying provider ${provider}:`,
        error?.message || error,
      );

      // Return empty response instead of throwing to allow other providers to succeed
      return {
        flights: [],
        total: 0,
        provider,
        format: 'unified',
        scrape_time_seconds: 0,
      };
    }
  }

  /**
   * Query multiple providers in parallel
   */
  async queryAllUnifiedProviders(
    providers: string[],
    origin: string,
    destination: string,
    date: string,
    returnDate?: string,
    userId: string = '1',
  ): Promise<Map<string, ScraperUnifiedResponse>> {
    this.logger.log(
      `Querying ${providers.length} providers in parallel: ${providers.join(', ')}`,
    );

    // Query all providers in parallel
    const promises = providers.map(async (provider) => {
      const response = await this.queryUnifiedProvider(
        provider,
        origin,
        destination,
        date,
        returnDate,
        userId,
      );
      return { provider, response };
    });

    const results = await Promise.all(promises);

    // Convert to Map for easy lookup
    const responseMap = new Map<string, ScraperUnifiedResponse>();
    results.forEach(({ provider, response }) => {
      responseMap.set(provider, response);
    });

    return responseMap;
  }

  /**
   * Get available providers from scraper API
   */
  async getAvailableProviders(): Promise<string[]> {
    // Only use these 4 providers for automated tracking
    const allowedProviders = ['alibaba', 'mrbilit', 'safar366', 'safarmarket'];
    
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ providers: any[] }>(
          `${this.scraperBaseUrl}/providers`,
          { timeout: 5000 },
        ),
      );

      const providerNames = response.data.providers
        .map((p) => p.name)
        .filter((name) => allowedProviders.includes(name));
      
      this.logger.log(`Available providers (filtered): ${providerNames.join(', ')}`);
      return providerNames;
    } catch (error: any) {
      this.logger.warn(
        'Failed to fetch providers from API, using defaults',
        error?.message,
      );
      // Return default providers if API call fails
      return [
        'alibaba',
        'safar366',
        'mrbilit',
        'safarmarket',
      ];
    }
  }
}
