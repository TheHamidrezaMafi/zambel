import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FlightTrackingService } from './flight-tracking.service';
import { ScraperService } from '../../scraper/services/scraper.service';
import { RouteConfig } from '../models/route-config.entity';

/**
 * AutomatedFlightTrackerService
 * Automatically tracks flight prices for configured routes
 * Runs every hour to collect price data for the next 7 days
 */
@Injectable()
export class AutomatedFlightTrackerService implements OnModuleInit {
  private readonly logger = new Logger(AutomatedFlightTrackerService.name);
  private isRunning = false;
  private readonly MAX_CONCURRENT_ROUTES = 3; // Process 3 routes at a time

  // Predefined routes: All major Iranian cities (both directions)
  private readonly DEFAULT_ROUTES = [
    // Tehran routes
    { origin: 'THR', destination: 'MHD', origin_name_fa: 'تهران', destination_name_fa: 'مشهد' },
    { origin: 'THR', destination: 'KIH', origin_name_fa: 'تهران', destination_name_fa: 'کیش' },
    { origin: 'THR', destination: 'AWZ', origin_name_fa: 'تهران', destination_name_fa: 'اهواز' },
    { origin: 'THR', destination: 'IFN', origin_name_fa: 'تهران', destination_name_fa: 'اصفهان' },
    { origin: 'THR', destination: 'SYZ', origin_name_fa: 'تهران', destination_name_fa: 'شیراز' },
    { origin: 'THR', destination: 'BND', origin_name_fa: 'تهران', destination_name_fa: 'بندر عباس' },
    { origin: 'THR', destination: 'TBZ', origin_name_fa: 'تهران', destination_name_fa: 'تبریز' },
    
    // Mashhad routes
    { origin: 'MHD', destination: 'THR', origin_name_fa: 'مشهد', destination_name_fa: 'تهران' },
    { origin: 'MHD', destination: 'KIH', origin_name_fa: 'مشهد', destination_name_fa: 'کیش' },
    { origin: 'MHD', destination: 'AWZ', origin_name_fa: 'مشهد', destination_name_fa: 'اهواز' },
    { origin: 'MHD', destination: 'IFN', origin_name_fa: 'مشهد', destination_name_fa: 'اصفهان' },
    { origin: 'MHD', destination: 'SYZ', origin_name_fa: 'مشهد', destination_name_fa: 'شیراز' },
    { origin: 'MHD', destination: 'BND', origin_name_fa: 'مشهد', destination_name_fa: 'بندر عباس' },
    { origin: 'MHD', destination: 'TBZ', origin_name_fa: 'مشهد', destination_name_fa: 'تبریز' },
    
    // Kish routes
    { origin: 'KIH', destination: 'THR', origin_name_fa: 'کیش', destination_name_fa: 'تهران' },
    { origin: 'KIH', destination: 'MHD', origin_name_fa: 'کیش', destination_name_fa: 'مشهد' },
    { origin: 'KIH', destination: 'AWZ', origin_name_fa: 'کیش', destination_name_fa: 'اهواز' },
    { origin: 'KIH', destination: 'IFN', origin_name_fa: 'کیش', destination_name_fa: 'اصفهان' },
    { origin: 'KIH', destination: 'SYZ', origin_name_fa: 'کیش', destination_name_fa: 'شیراز' },
    { origin: 'KIH', destination: 'BND', origin_name_fa: 'کیش', destination_name_fa: 'بندر عباس' },
    { origin: 'KIH', destination: 'TBZ', origin_name_fa: 'کیش', destination_name_fa: 'تبریز' },
    
    // Ahvaz routes
    { origin: 'AWZ', destination: 'THR', origin_name_fa: 'اهواز', destination_name_fa: 'تهران' },
    { origin: 'AWZ', destination: 'MHD', origin_name_fa: 'اهواز', destination_name_fa: 'مشهد' },
    { origin: 'AWZ', destination: 'KIH', origin_name_fa: 'اهواز', destination_name_fa: 'کیش' },
    { origin: 'AWZ', destination: 'IFN', origin_name_fa: 'اهواز', destination_name_fa: 'اصفهان' },
    { origin: 'AWZ', destination: 'SYZ', origin_name_fa: 'اهواز', destination_name_fa: 'شیراز' },
    { origin: 'AWZ', destination: 'BND', origin_name_fa: 'اهواز', destination_name_fa: 'بندر عباس' },
    { origin: 'AWZ', destination: 'TBZ', origin_name_fa: 'اهواز', destination_name_fa: 'تبریز' },
    
    // Isfahan routes
    { origin: 'IFN', destination: 'THR', origin_name_fa: 'اصفهان', destination_name_fa: 'تهران' },
    { origin: 'IFN', destination: 'MHD', origin_name_fa: 'اصفهان', destination_name_fa: 'مشهد' },
    { origin: 'IFN', destination: 'KIH', origin_name_fa: 'اصفهان', destination_name_fa: 'کیش' },
    { origin: 'IFN', destination: 'AWZ', origin_name_fa: 'اصفهان', destination_name_fa: 'اهواز' },
    { origin: 'IFN', destination: 'SYZ', origin_name_fa: 'اصفهان', destination_name_fa: 'شیراز' },
    { origin: 'IFN', destination: 'BND', origin_name_fa: 'اصفهان', destination_name_fa: 'بندر عباس' },
    { origin: 'IFN', destination: 'TBZ', origin_name_fa: 'اصفهان', destination_name_fa: 'تبریز' },
    
    // Shiraz routes
    { origin: 'SYZ', destination: 'THR', origin_name_fa: 'شیراز', destination_name_fa: 'تهران' },
    { origin: 'SYZ', destination: 'MHD', origin_name_fa: 'شیراز', destination_name_fa: 'مشهد' },
    { origin: 'SYZ', destination: 'KIH', origin_name_fa: 'شیراز', destination_name_fa: 'کیش' },
    { origin: 'SYZ', destination: 'AWZ', origin_name_fa: 'شیراز', destination_name_fa: 'اهواز' },
    { origin: 'SYZ', destination: 'IFN', origin_name_fa: 'شیراز', destination_name_fa: 'اصفهان' },
    { origin: 'SYZ', destination: 'BND', origin_name_fa: 'شیراز', destination_name_fa: 'بندر عباس' },
    { origin: 'SYZ', destination: 'TBZ', origin_name_fa: 'شیراز', destination_name_fa: 'تبریز' },
    
    // Bandar Abbas routes
    { origin: 'BND', destination: 'THR', origin_name_fa: 'بندر عباس', destination_name_fa: 'تهران' },
    { origin: 'BND', destination: 'MHD', origin_name_fa: 'بندر عباس', destination_name_fa: 'مشهد' },
    { origin: 'BND', destination: 'KIH', origin_name_fa: 'بندر عباس', destination_name_fa: 'کیش' },
    { origin: 'BND', destination: 'AWZ', origin_name_fa: 'بندر عباس', destination_name_fa: 'اهواز' },
    { origin: 'BND', destination: 'IFN', origin_name_fa: 'بندر عباس', destination_name_fa: 'اصفهان' },
    { origin: 'BND', destination: 'SYZ', origin_name_fa: 'بندر عباس', destination_name_fa: 'شیراز' },
    { origin: 'BND', destination: 'TBZ', origin_name_fa: 'بندر عباس', destination_name_fa: 'تبریز' },
    
    // Tabriz routes
    { origin: 'TBZ', destination: 'THR', origin_name_fa: 'تبریز', destination_name_fa: 'تهران' },
    { origin: 'TBZ', destination: 'MHD', origin_name_fa: 'تبریز', destination_name_fa: 'مشهد' },
    { origin: 'TBZ', destination: 'KIH', origin_name_fa: 'تبریز', destination_name_fa: 'کیش' },
    { origin: 'TBZ', destination: 'AWZ', origin_name_fa: 'تبریز', destination_name_fa: 'اهواز' },
    { origin: 'TBZ', destination: 'IFN', origin_name_fa: 'تبریز', destination_name_fa: 'اصفهان' },
    { origin: 'TBZ', destination: 'SYZ', origin_name_fa: 'تبریز', destination_name_fa: 'شیراز' },
    { origin: 'TBZ', destination: 'BND', origin_name_fa: 'تبریز', destination_name_fa: 'بندر عباس' },
  ];

  constructor(
    private readonly trackingService: FlightTrackingService,
    private readonly scraperService: ScraperService,
  ) {}

  /**
   * Initialize default routes on module startup
   */
  async onModuleInit() {
    this.logger.log('Initializing automated flight tracker...');
    try {
      await this.initializeDefaultRoutes();
      this.logger.log('Automated flight tracker initialized successfully');
    } catch (error) {
      this.logger.warn('Could not initialize routes (tables may not exist yet). Use manual initialization endpoint.');
      this.logger.warn('POST /flight-tracking/init to create tables and initialize routes');
    }
  }

  /**
   * Public method to initialize the system (called from controller)
   */
  async initializeSystem(): Promise<{ routes_created: number }> {
    this.logger.log('Initializing flight tracking system...');
    await this.initializeDefaultRoutes();
    return {
      routes_created: this.DEFAULT_ROUTES.length,
    };
  }

  /**
   * Create default route configurations if they don't exist
   */
  private async initializeDefaultRoutes(): Promise<void> {
    for (const route of this.DEFAULT_ROUTES) {
      try {
        await this.trackingService.upsertRouteConfig({
          origin: route.origin,
          destination: route.destination,
          origin_name_fa: route.origin_name_fa,
          destination_name_fa: route.destination_name_fa,
          is_active: true,
          days_ahead: 7,
          tracking_interval_minutes: 60,
        });
        this.logger.log(`Route configured: ${route.origin} -> ${route.destination}`);
      } catch (error) {
        this.logger.error(`Error configuring route ${route.origin} -> ${route.destination}:`, error);
      }
    }
  }

  /**
   * Main cron job - runs every hour
   * Tracks flights for all active routes
   */
  @Cron(CronExpression.EVERY_HOUR)
  async trackFlightPrices(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Previous tracking job is still running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    this.logger.log('=== Starting automated flight price tracking ===');

    try {
      const activeRoutes = await this.trackingService.getActiveRouteConfigs();
      this.logger.log(`Found ${activeRoutes.length} active routes to track`);

      // Process routes in batches
      for (let i = 0; i < activeRoutes.length; i += this.MAX_CONCURRENT_ROUTES) {
        const batch = activeRoutes.slice(i, i + this.MAX_CONCURRENT_ROUTES);
        await Promise.all(batch.map((route) => this.trackRouteFlights(route)));
        
        // Small delay between batches to avoid overwhelming the scrapers
        if (i + this.MAX_CONCURRENT_ROUTES < activeRoutes.length) {
          await this.sleep(5000); // 5 seconds between batches
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`=== Completed flight tracking in ${duration}s ===`);
    } catch (error) {
      this.logger.error('Error in automated tracking:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Track all flights for a specific route
   */
  private async trackRouteFlights(route: RouteConfig): Promise<void> {
    const routeLabel = `${route.origin}->${route.destination}`;
    this.logger.log(`Tracking route: ${routeLabel}`);

    try {
      const daysAhead = route.days_ahead || 7;
      const today = new Date();
      
      // Process each day sequentially for this route
      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        const dateString = targetDate.toISOString().split('T')[0];

        try {
          await this.trackFlightsForDate(route, dateString);
          
          // Small delay between days
          if (dayOffset < daysAhead - 1) {
            await this.sleep(2000); // 2 seconds between dates
          }
        } catch (error) {
          this.logger.error(`Error tracking ${routeLabel} on ${dateString}:`, error);
          // Continue with next date even if one fails
        }
      }

      // Update last tracked time
      await this.trackingService.updateRouteLastTracked(route.id);
      this.logger.log(`Completed tracking route: ${routeLabel}`);
    } catch (error) {
      this.logger.error(`Error processing route ${routeLabel}:`, error);
    }
  }

  /**
   * Track flights for a specific route and date
   */
  private async trackFlightsForDate(route: RouteConfig, date: string): Promise<void> {
    try {
      // Prepare scraper request
      const scraperRequest = {
        provider_name: '', // Empty = all providers
        requests: [
          {
            requested_by_user_id: 'automated_tracker',
            from_date: date,
            to_date: date,
            from_destination: route.origin,
            to_destination: route.destination,
            is_foreign_flight: false,
            type: '1',
          },
        ],
      };

      // If route has preferred providers, use them
      if (route.tracking_settings?.preferred_providers?.length > 0) {
        for (const provider of route.tracking_settings.preferred_providers) {
          scraperRequest.provider_name = provider;
          await this.scrapeAndStore(scraperRequest, route, date);
        }
      } else {
        // Use all providers
        await this.scrapeAndStore(scraperRequest, route, date);
      }
    } catch (error) {
      this.logger.error(
        `Failed to track flights for ${route.origin}->${route.destination} on ${date}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Scrape flights and store in database
   */
  private async scrapeAndStore(scraperRequest: any, route: RouteConfig, date: string): Promise<void> {
    try {
      // Call the scraper service
      const response = await this.scraperService.takeRequests(scraperRequest);

      if (response.flights && response.flights.length > 0) {
        this.logger.log(
          `Found ${response.flights.length} flights for ${route.origin}->${route.destination} on ${date}`,
        );

        // Group flights by unique identifier (flight_number + date + origin + destination)
        const flightGroups = new Map<string, any[]>();
        
        for (const flight of response.flights) {
          // Normalize the flight number for grouping
          const normalizedFlightNumber = this.normalizeFlightNumber(flight.flight_number);
          const flightKey = `${normalizedFlightNumber}_${date}_${flight.origin}_${flight.destination}`;
          
          if (!flightGroups.has(flightKey)) {
            flightGroups.set(flightKey, []);
          }
          flightGroups.get(flightKey).push(flight);
        }

        // Process each unique flight
        for (const [flightKey, flightInstances] of flightGroups) {
          try {
            // Store all price records from different providers
            let trackedFlightId: string | null = null;
            const providersData: Array<{ provider: string; price: number }> = [];

            for (const flight of flightInstances) {
              const flightId = await this.trackingService.processScrapedFlight(flight);
              if (flightId && !trackedFlightId) {
                trackedFlightId = flightId;
              }
              
              providersData.push({
                provider: flight.provider_name,
                price: Number(flight.adult_price),
              });
            }

            // Calculate and store the lowest price among all providers
            if (trackedFlightId && providersData.length > 0) {
              await this.trackingService.calculateAndStoreLowestPrice(trackedFlightId, providersData);
            }
          } catch (error) {
            this.logger.error(`Error storing flight group ${flightKey}:`, error);
            // Continue with next flight even if one fails
          }
        }

        this.logger.log(
          `Stored ${response.flights.length} flight records for ${route.origin}->${route.destination} on ${date}`,
        );
      } else {
        this.logger.log(`No flights found for ${route.origin}->${route.destination} on ${date}`);
      }
    } catch (error) {
      this.logger.error(`Scraping failed for ${route.origin}->${route.destination} on ${date}:`, error);
      throw error;
    }
  }

  /**
   * Normalize flight number (same logic as tracking service)
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
   * Manual trigger for testing
   */
  async manualTrack(): Promise<void> {
    this.logger.log('Manual tracking triggered');
    await this.trackFlightPrices();
  }

  /**
   * Track a specific route manually
   */
  async trackSpecificRoute(origin: string, destination: string): Promise<void> {
    const route = await this.trackingService.getActiveRouteConfigs();
    const targetRoute = route.find((r) => r.origin === origin && r.destination === destination);

    if (!targetRoute) {
      throw new Error(`Route ${origin} -> ${destination} not found`);
    }

    await this.trackRouteFlights(targetRoute);
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get tracking status
   */
  getTrackingStatus(): { isRunning: boolean; routes: number } {
    return {
      isRunning: this.isRunning,
      routes: this.DEFAULT_ROUTES.length,
    };
  }
}
