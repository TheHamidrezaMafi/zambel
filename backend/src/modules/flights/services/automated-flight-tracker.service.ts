import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FlightTrackingService } from './flight-tracking.service';
import { ScraperHttpService } from '../../scraper/services/scraper-http.service';
import { FlightAggregationService } from './flight-aggregation.service';
import { FlightTrackingProgressService } from './flight-tracking-progress.service';
import { ScrapingSessionService } from './scraping-session.service';
import { RouteConfig } from '../models/route-config.entity';

/**
 * AutomatedFlightTrackerService
 * Automatically tracks flight prices for configured routes with unified API
 * Runs every hour to collect price data for the next 7 days
 * Features: Progress tracking, multiple providers, intelligent grouping, pause/stop controls
 */
@Injectable()
export class AutomatedFlightTrackerService implements OnModuleInit {
  private readonly logger = new Logger(AutomatedFlightTrackerService.name);
  private isRunning = false;
  private isPaused = false;
  private shouldStop = false;
  private currentSessionId: string | null = null;
  private readonly MAX_CONCURRENT_ROUTES = 2; // Process 2 routes at a time

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
    private readonly scraperService: ScraperHttpService,
    private readonly aggregationService: FlightAggregationService,
    private readonly progressService: FlightTrackingProgressService,
    private readonly sessionService: ScrapingSessionService,
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
   * Tracks flights for all active routes with progress tracking
   */
  @Cron(CronExpression.EVERY_HOUR)
  async trackFlightPrices(): Promise<void> {
    await this.runTrackingJob('cron');
  }

  /**
   * Core tracking logic with pause/stop support
   */
  private async runTrackingJob(triggerType: 'cron' | 'manual' | 'api'): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('⚠️  Previous tracking job is still running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.shouldStop = false;
    const startTime = Date.now();
    
    this.logger.log('\n' + '═'.repeat(60));
    this.logger.log('🚀 STARTING AUTOMATED FLIGHT PRICE TRACKING');
    this.logger.log('═'.repeat(60));

    let session = null;

    try {
      const activeRoutes = await this.trackingService.getActiveRouteConfigs();
      this.logger.log(`📋 Found ${activeRoutes.length} active routes to track\n`);

      // Create session record
      session = await this.sessionService.createSession(triggerType, activeRoutes.length);
      this.currentSessionId = session.id;

      // Start progress tracking session
      const sessionId = this.progressService.startSession(
        activeRoutes.map(route => ({
          id: parseInt(route.id as any) || 0,
          origin: route.origin,
          destination: route.destination,
          daysAhead: route.days_ahead || 7,
        }))
      );

      // Process routes sequentially with progress tracking
      for (let i = 0; i < activeRoutes.length; i++) {
        // Check for stop signal
        if (this.shouldStop) {
          this.logger.warn('⏹️  Stop signal received, terminating tracking');
          await this.sessionService.updateSessionStatus(session.id, 'stopped');
          break;
        }

        // Check for pause signal
        while (this.isPaused && !this.shouldStop) {
          await this.sleep(1000); // Wait 1 second and check again
        }

        if (this.shouldStop) {
          this.logger.warn('⏹️  Stop signal received during pause, terminating tracking');
          await this.sessionService.updateSessionStatus(session.id, 'stopped');
          break;
        }

        const route = activeRoutes[i];
        try {
          await this.trackRouteFlights(route);
          
          // Update session with current progress
          const progress = this.progressService.getCurrentProgress();
          if (progress && progress.routes) {
            const routesArray = Array.from(progress.routes.values());
            await this.sessionService.updateSessionProgress(session.id, {
              completed_routes: routesArray.filter(r => r.status === 'completed').length,
              failed_routes: routesArray.filter(r => r.status === 'failed').length,
              total_flights_found: routesArray.reduce((sum, r) => sum + r.flightsFound, 0),
              total_flights_saved: routesArray.reduce((sum, r) => sum + r.flightsSaved, 0),
              total_errors: routesArray.reduce((sum, r) => sum + r.errors.length, 0),
              route_details: routesArray.map(r => ({
                route: `${r.origin} → ${r.destination}`,
                status: r.status,
                flights_found: r.flightsFound,
                flights_saved: r.flightsSaved,
                errors: r.errors.length,
              })),
            });
          }
        } catch (error: any) {
          this.logger.error(`❌ Failed to track route ${route.origin} → ${route.destination}:`, error);
          this.progressService.failRoute(route.origin, route.destination, error?.message || 'Unknown error');
        }
        
        // Small delay between routes
        if (i < activeRoutes.length - 1 && !this.shouldStop) {
          await this.sleep(3000); // 3 seconds between routes
        }
      }

      // Complete session
      this.progressService.completeSession();

      const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      
      if (this.shouldStop) {
        this.logger.log(`\n⏹️  Tracking stopped by user after ${duration} minutes`);
      } else {
        this.logger.log(`\n✅ All tracking completed in ${duration} minutes`);
        if (session) {
          await this.sessionService.updateSessionStatus(session.id, 'completed');
        }
      }
    } catch (error: any) {
      this.logger.error('❌ Error in automated tracking:', error);
      if (this.progressService.getCurrentProgress()) {
        this.progressService.completeSession();
      }
      if (session) {
        await this.sessionService.updateSessionStatus(session.id, 'failed', error?.message || 'Unknown error');
      }
    } finally {
      this.isRunning = false;
      this.isPaused = false;
      this.shouldStop = false;
      this.currentSessionId = null;
    }
  }

  /**
   * Track all flights for a specific route with progress tracking
   */
  private async trackRouteFlights(route: RouteConfig): Promise<void> {
    // Start route progress tracking
    this.progressService.startRoute(route.origin, route.destination);

    try {
      const daysAhead = route.days_ahead || 7;
      const today = new Date();
      
      // Process each day sequentially for this route
      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        const dateString = targetDate.toISOString().split('T')[0];

        // Start day progress
        this.progressService.startDay(route.origin, route.destination, dayOffset, dateString);

        try {
          const result = await this.trackFlightsForDate(route, dateString);
          
          // Complete day with results
          this.progressService.completeDay(
            route.origin,
            route.destination,
            dayOffset,
            result.flightsFound,
            result.flightsSaved
          );
          
          // Small delay between days
          if (dayOffset < daysAhead - 1) {
            await this.sleep(2000); // 2 seconds between dates
          }
        } catch (error: any) {
          this.progressService.addDayError(
            route.origin,
            route.destination,
            dayOffset,
            dateString,
            error?.message || 'Unknown error'
          );
          // Continue with next date even if one fails
        }
      }

      // Update last tracked time
      await this.trackingService.updateRouteLastTracked(route.id);
      
      // Complete route
      this.progressService.completeRoute(route.origin, route.destination);
    } catch (error: any) {
      this.logger.error(`Error processing route ${route.origin} → ${route.destination}:`, error);
      this.progressService.failRoute(route.origin, route.destination, error?.message || 'Unknown error');
    }
  }

  /**
   * Track flights for a specific route and date using unified API
   */
  private async trackFlightsForDate(
    route: RouteConfig,
    date: string
  ): Promise<{ flightsFound: number; flightsSaved: number }> {
    try {
      // Use aggregation service to search flights from all providers
      const searchResult = await this.aggregationService.searchFlights(
        route.origin,
        route.destination,
        date,
        undefined, // no return date
        'automated_tracker'
      );

      let flightsFound = 0;
      let flightsSaved = 0;

      // Count all pricing options from all providers
      flightsFound = searchResult.metadata.total_options;

      // Process each grouped flight (base_flight_id)
      for (const groupedFlight of searchResult.flights) {
        try {
          // Save the base flight and all its pricing options to database
          await this.saveGroupedFlight(groupedFlight, route, date);
          flightsSaved += groupedFlight.pricingOptions.length;
        } catch (error: any) {
          this.logger.error(
            `Failed to save flight ${groupedFlight.base_flight_id} to database:`,
            error?.message || error
          );
        }
      }

      return { flightsFound, flightsSaved };
    } catch (error: any) {
      this.logger.error(
        `Failed to track flights for ${route.origin}->${route.destination} on ${date}:`,
        error?.message || error,
      );
      throw error;
    }
  }

  /**
   * Save a grouped flight with all its pricing options to the database
   */
  private async saveGroupedFlight(
    groupedFlight: any,
    route: RouteConfig,
    date: string
  ): Promise<void> {
    try {
      // Store each pricing option as a separate flight record
      const providersData: Array<{ provider: string; price: number }> = [];
      let trackedFlightId: string | null = null;

      for (const pricingOption of groupedFlight.pricingOptions) {
        // Create a flight object compatible with the existing tracking service
        const flightData = {
          flight_id: pricingOption.flight_id,
          flight_number: groupedFlight.flight_number,
          airline_name: groupedFlight.airline.name_en,
          airline_name_fa: groupedFlight.airline.name_fa,
          airline_code: groupedFlight.airline.code,
          origin: groupedFlight.route.origin,
          destination: groupedFlight.route.destination,
          departure_date_time: groupedFlight.schedule.departure_datetime,
          arrival_date_time: groupedFlight.schedule.arrival_datetime,
          duration_minutes: groupedFlight.schedule.duration_minutes,
          adult_price: pricingOption.price,
          child_price: pricingOption.price,
          infant_price: pricingOption.price,
          capacity: pricingOption.capacity,
          cabin_class: pricingOption.cabin_class,
          is_charter: pricingOption.is_charter,
          provider_name: pricingOption.provider,
          original_id: pricingOption.original_id,
          base_flight_id: groupedFlight.base_flight_id,
        };

        const flightId = await this.trackingService.processScrapedFlight(flightData);
        if (flightId && !trackedFlightId) {
          trackedFlightId = flightId;
        }

        providersData.push({
          provider: pricingOption.provider,
          price: pricingOption.price,
        });
      }

      // Calculate and store the lowest price among all providers
      if (trackedFlightId && providersData.length > 0) {
        await this.trackingService.calculateAndStoreLowestPrice(trackedFlightId, providersData);
      }
    } catch (error: any) {
      this.logger.error(
        `Error saving grouped flight ${groupedFlight.base_flight_id}:`,
        error?.message || error
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
    await this.runTrackingJob('manual');
  }

  /**
   * Pause the current tracking session
   */
  async pauseTracking(): Promise<{ success: boolean; message: string }> {
    if (!this.isRunning) {
      return { success: false, message: 'No tracking session is currently running' };
    }

    if (this.isPaused) {
      return { success: false, message: 'Tracking is already paused' };
    }

    this.isPaused = true;
    this.logger.log('⏸️  Tracking paused by user');

    if (this.currentSessionId) {
      await this.sessionService.updateSessionStatus(this.currentSessionId, 'paused');
    }

    return { success: true, message: 'Tracking paused successfully' };
  }

  /**
   * Resume the paused tracking session
   */
  async resumeTracking(): Promise<{ success: boolean; message: string }> {
    if (!this.isRunning) {
      return { success: false, message: 'No tracking session is currently running' };
    }

    if (!this.isPaused) {
      return { success: false, message: 'Tracking is not paused' };
    }

    this.isPaused = false;
    this.logger.log('▶️  Tracking resumed by user');

    if (this.currentSessionId) {
      await this.sessionService.updateSessionStatus(this.currentSessionId, 'running');
    }

    return { success: true, message: 'Tracking resumed successfully' };
  }

  /**
   * Stop the current tracking session
   */
  async stopTracking(): Promise<{ success: boolean; message: string }> {
    if (!this.isRunning) {
      return { success: false, message: 'No tracking session is currently running' };
    }

    this.shouldStop = true;
    this.isPaused = false; // Unpause if paused
    this.logger.log('⏹️  Stop signal sent, tracking will terminate after current route');

    return { success: true, message: 'Stop signal sent. Tracking will terminate gracefully.' };
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
  getTrackingStatus(): { 
    isRunning: boolean; 
    isPaused: boolean;
    routes: number;
    currentSessionId: string | null;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      routes: this.DEFAULT_ROUTES.length,
      currentSessionId: this.currentSessionId,
    };
  }
}
