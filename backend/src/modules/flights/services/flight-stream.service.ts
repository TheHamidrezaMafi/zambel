import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Observable, Subject, from, concatMap, delay, finalize } from 'rxjs';
import { ScraperHttpService } from '../../scraper/services/scraper-http.service';
import { FlightSearchDto } from '../dto/flight-search.dto';
import { GroupedFlight } from './flight-aggregation.service';
import * as fs from 'fs';
import * as path from 'path';

interface StreamEvent {
  type: 'provider_result' | 'search_complete' | 'error' | 'progress';
  provider?: string;
  flights?: GroupedFlight[];
  metadata?: any;
  progress?: {
    completed: number;
    total: number;
    providers_completed: string[];
    providers_remaining: string[];
  };
  error?: string;
  timestamp: string;
}

@Injectable()
export class FlightStreamService {
  private readonly logger = new Logger(FlightStreamService.name);
  private logoMap: Record<string, string> = {};

  constructor(private readonly scraperHttpService: ScraperHttpService) {
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
          this.logger.log(`✅ Loaded ${Object.keys(this.logoMap).length} airline logos`);
          return;
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Could not load logo map:', error);
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
   * Convert unified flight format to grouped flight format
   */
  private convertToGroupedFlights(flights: any[], provider: string): GroupedFlight[] {
    const groupMap = new Map<string, GroupedFlight>();

    for (const flight of flights) {
      const baseFlightId = flight.base_flight_id;

      if (!groupMap.has(baseFlightId)) {
        // Create new grouped flight
        groupMap.set(baseFlightId, {
          base_flight_id: baseFlightId,
          flight_number: flight.flight_number,
          airline: {
            code: flight.airline?.code || '',
            name_fa: flight.airline?.name_fa || '',
            name_en: flight.airline?.name_en || '',
            logo_url: this.getLogoUrl(flight.airline?.code, flight.airline?.logo_url),
          },
          route: {
            origin: flight.route?.origin?.airport_code || '',
            destination: flight.route?.destination?.airport_code || '',
            origin_city_fa: flight.route?.origin?.city_name_fa || '',
            destination_city_fa: flight.route?.destination?.city_name_fa || '',
            origin_terminal: flight.route?.origin?.terminal,
            destination_terminal: flight.route?.destination?.terminal,
          },
          schedule: {
            departure_datetime: flight.schedule?.departure_datetime || '',
            arrival_datetime: flight.schedule?.arrival_datetime || '',
            duration_minutes: flight.schedule?.duration_minutes || 0,
            stops: flight.schedule?.stops || 0,
          },
          lowestPrice: flight.pricing?.adult?.total_fare || 0,
          highestPrice: flight.pricing?.adult?.total_fare || 0,
          availableProviders: 1,
          pricingOptions: [],
        });
      }

      const grouped = groupMap.get(baseFlightId)!;

      // Update price range
      const price = flight.pricing?.adult?.total_fare || 0;
      if (price > 0) {
        grouped.lowestPrice = Math.min(grouped.lowestPrice, price);
        grouped.highestPrice = Math.max(grouped.highestPrice, price);
      }

      // Add pricing option
      grouped.pricingOptions.push({
        flight_id: flight.flight_id,
        provider: provider,
        price: price,
        cabin_class: flight.cabin?.class || 'economy',
        cabin_class_fa: flight.cabin?.class_display_name_fa || 'اکونومی',
        capacity: flight.ticket_info?.capacity || 0,
        is_refundable: flight.ticket_info?.is_refundable || false,
        is_charter: flight.ticket_info?.is_charter || false,
        cabin: flight.cabin?.class || 'Economy',
        ticket_type: flight.ticket_info?.type || 'system',
        baggage_kg: flight.baggage_allowance?.checked?.weight_kg,
        booking_class: flight.cabin?.booking_class,
        original_id: flight.original_id || '',
      });

      // Update available providers count (unique)
      const uniqueProviders = new Set(grouped.pricingOptions.map((opt) => opt.provider));
      grouped.availableProviders = uniqueProviders.size;
    }

    return Array.from(groupMap.values());
  }

  /**
   * Stream flight search results progressively
   */
  streamFlightSearch(searchDto: { origin: string; destination: string; departure_date: string; return_date?: string }): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const startTime = Date.now();
      const subject = new Subject<StreamEvent>();

      // Convert Subject to MessageEvent Observable
      const messageStream = subject.asObservable().pipe(
        concatMap((event) =>
          from([{ data: event } as MessageEvent]).pipe(delay(10)),
        ),
        finalize(() => {
          this.logger.log('Stream completed');
        }),
      );

      // Subscribe the main subscriber to message stream
      messageStream.subscribe(subscriber);

      // Execute the search
      this.executeStreamingSearch(searchDto, subject, startTime);

      // Cleanup on unsubscribe
      return () => {
        this.logger.log('Client disconnected from stream');
        subject.complete();
      };
    });
  }

  /**
   * Execute the streaming search
   */
  private async executeStreamingSearch(
    searchDto: { origin: string; destination: string; departure_date: string; return_date?: string },
    subject: Subject<StreamEvent>,
    startTime: number,
  ) {
    try {
      const origin = searchDto.origin;
      const destination = searchDto.destination;
      const date = searchDto.departure_date;
      const returnDate = searchDto.return_date;
      const userId = '1';

      this.logger.log(`Starting streaming search: ${origin} → ${destination} on ${date}`);

      // Get available providers
      const providers = await this.scraperHttpService.getAvailableProviders();
      this.logger.log(`Querying ${providers.length} providers: ${providers.join(', ')}`);

      let completedProviders: string[] = [];
      const failedProviders: string[] = [];

      // Query each provider sequentially and stream results
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];

        try {
          this.logger.log(`Querying provider: ${provider} (${i + 1}/${providers.length})`);

          const response = await this.scraperHttpService.queryUnifiedProvider(
            provider,
            origin,
            destination,
            date,
            returnDate,
            userId,
          );

          if (response.flights && response.flights.length > 0) {
            // Convert to grouped flights
            const groupedFlights = this.convertToGroupedFlights(response.flights, provider);

            // Send provider result event
            subject.next({
              type: 'provider_result',
              provider: provider,
              flights: groupedFlights,
              metadata: {
                provider_name: provider,
                flight_count: groupedFlights.length,
                option_count: response.flights.length,
                scrape_time_seconds: response.scrape_time_seconds,
              },
              timestamp: new Date().toISOString(),
            });

            completedProviders.push(provider);
            this.logger.log(`✅ ${provider}: ${groupedFlights.length} flights sent to client`);
          } else {
            failedProviders.push(provider);
            this.logger.log(`⚠️ ${provider}: No flights found`);
          }

          // Send progress update
          subject.next({
            type: 'progress',
            progress: {
              completed: i + 1,
              total: providers.length,
              providers_completed: [...completedProviders, ...failedProviders],
              providers_remaining: providers.slice(i + 1),
            },
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          this.logger.error(`Error querying provider ${provider}:`, error.message);
          failedProviders.push(provider);

          // Send progress update even for failed provider
          subject.next({
            type: 'progress',
            progress: {
              completed: i + 1,
              total: providers.length,
              providers_completed: [...completedProviders, ...failedProviders],
              providers_remaining: providers.slice(i + 1),
            },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Send completion event
      const totalTime = Date.now() - startTime;
      subject.next({
        type: 'search_complete',
        metadata: {
          total_providers: providers.length,
          successful_providers: completedProviders.length,
          failed_providers: failedProviders.length,
          providers_successful: completedProviders,
          providers_failed: failedProviders,
          total_time_ms: totalTime,
        },
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Search completed in ${totalTime}ms: ${completedProviders.length}/${providers.length} providers successful`,
      );

      // Complete the stream
      subject.complete();
    } catch (error: any) {
      this.logger.error('Stream search failed:', error);
      subject.next({
        type: 'error',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      subject.complete();
    }
  }
}
