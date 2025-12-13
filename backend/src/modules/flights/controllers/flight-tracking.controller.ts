import { Controller, Get, Post, Query, Param, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { FlightTrackingService } from '../services/flight-tracking.service';
import { AutomatedFlightTrackerService } from '../services/automated-flight-tracker.service';
import { FlightTrackingProgressService } from '../services/flight-tracking-progress.service';
import { ScrapingSessionService } from '../services/scraping-session.service';
import {
  FlightPriceQueryDto,
  TrackedFlightDto,
  PriceStatisticsDto,
  RouteConfigDto,
} from '../dto/flight-tracking.dto';

@ApiTags('Flight Tracking')
@Controller('flight-tracking')
export class FlightTrackingController {
  constructor(
    private readonly trackingService: FlightTrackingService,
    private readonly automatedTracker: AutomatedFlightTrackerService,
    private readonly progressService: FlightTrackingProgressService,
    private readonly sessionService: ScrapingSessionService,
  ) {}

  /**
   * Query flight price history with filters
   */
  @Get('prices')
  @ApiOperation({ summary: 'جستجوی تاریخچه قیمت پرواز با فیلتر' })
  @ApiResponse({ status: 200, description: 'لیست پرواز‌ها با تاریخچه قیمت' })
  async queryFlightPrices(@Query() query: FlightPriceQueryDto) {
    try {
      return await this.trackingService.queryFlightPrices(query);
    } catch (error) {
      throw new HttpException(
        'Error querying flight prices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get price statistics for a specific flight
   */
  @Get('statistics/:flightNumber/:date/:origin/:destination')
  @ApiOperation({ summary: 'دریافت آمار قیمت برای یک پرواز خاص' })
  @ApiParam({ name: 'flightNumber', description: 'شماره پرواز', example: 'IR263' })
  @ApiParam({ name: 'date', description: 'تاریخ پرواز (YYYY-MM-DD)', example: '2025-01-15' })
  @ApiParam({ name: 'origin', description: 'مبدا', example: 'THR' })
  @ApiParam({ name: 'destination', description: 'مقصد', example: 'MHD' })
  @ApiResponse({ status: 200, description: 'آمار قیمت پرواز', type: PriceStatisticsDto })
  async getFlightStatistics(
    @Param('flightNumber') flightNumber: string,
    @Param('date') date: string,
    @Param('origin') origin: string,
    @Param('destination') destination: string,
  ) {
    try {
      const flightDate = new Date(date);
      const stats = await this.trackingService.getFlightPriceStatistics(
        flightNumber,
        flightDate,
        origin,
        destination,
      );

      if (!stats) {
        throw new HttpException('Flight not found', HttpStatus.NOT_FOUND);
      }

      return stats;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error fetching flight statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get price trends for a specific route
   */
  @Get('trends/:origin/:destination')
  @ApiOperation({ summary: 'دریافت روند قیمت برای یک مسیر خاص' })
  @ApiParam({ name: 'origin', description: 'مبدا', example: 'THR' })
  @ApiParam({ name: 'destination', description: 'مقصد', example: 'MHD' })
  @ApiQuery({ name: 'daysAhead', required: false, description: 'تعداد روز جلو', example: 7 })
  @ApiResponse({ status: 200, description: 'روند قیمت مسیر' })
  async getRoutePriceTrends(
    @Param('origin') origin: string,
    @Param('destination') destination: string,
    @Query('daysAhead') daysAhead?: number,
  ) {
    try {
      return await this.trackingService.getRoutePriceTrends(
        origin,
        destination,
        daysAhead || 7,
      );
    } catch (error) {
      throw new HttpException(
        'Error fetching route trends',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all active route configurations
   */
  @Get('routes')
  @ApiOperation({ summary: 'دریافت تمام مسیرهای فعال' })
  @ApiResponse({ status: 200, description: 'لیست مسیرهای فعال' })
  async getActiveRoutes() {
    try {
      return await this.trackingService.getActiveRouteConfigs();
    } catch (error) {
      throw new HttpException(
        'Error fetching routes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create or update a route configuration
   */
  @Post('routes')
  @ApiOperation({ summary: 'ایجاد یا بروزرسانی تنظیمات مسیر' })
  @ApiResponse({ status: 201, description: 'تنظیمات مسیر ایجاد/بروزرسانی شد' })
  async createOrUpdateRoute(@Body() routeConfig: RouteConfigDto) {
    try {
      return await this.trackingService.upsertRouteConfig(routeConfig);
    } catch (error) {
      throw new HttpException(
        'Error creating/updating route',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Initialize flight tracking system (creates tables and default routes)
   */
  @Post('init')
  @ApiOperation({ summary: 'راه‌اندازی اولیه سیستم ردیابی پرواز' })
  @ApiResponse({ status: 200, description: 'سیستم با موفقیت راه‌اندازی شد' })
  async initializeSystem() {
    try {
      // This will create tables via synchronize and initialize routes
      const result = await this.automatedTracker.initializeSystem();
      return {
        message: 'Flight tracking system initialized successfully',
        ...result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Error initializing system: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Manually trigger tracking for all routes
   */
  @Post('track/manual')
  @ApiOperation({ summary: 'اجرای دستی ردیابی برای تمام مسیرها' })
  @ApiResponse({ status: 200, description: 'ردیابی دستی شروع شد' })
  async manualTrackAll() {
    try {
      // Run in background
      this.automatedTracker.manualTrack().catch((error) => {
        console.error('Manual tracking error:', error);
      });

      return {
        message: 'Manual tracking started',
        status: 'running',
      };
    } catch (error) {
      throw new HttpException(
        'Error starting manual tracking',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Manually trigger tracking for a specific route
   */
  @Post('track/route/:origin/:destination')
  @ApiOperation({ summary: 'اجرای دستی ردیابی برای یک مسیر خاص' })
  @ApiParam({ name: 'origin', description: 'مبدا', example: 'THR' })
  @ApiParam({ name: 'destination', description: 'مقصد', example: 'MHD' })
  @ApiResponse({ status: 200, description: 'ردیابی مسیر شروع شد' })
  async manualTrackRoute(
    @Param('origin') origin: string,
    @Param('destination') destination: string,
  ) {
    try {
      // Run in background
      this.automatedTracker
        .trackSpecificRoute(origin, destination)
        .catch((error) => {
          console.error(`Manual tracking error for ${origin}->${destination}:`, error);
        });

      return {
        message: `Tracking started for route ${origin} -> ${destination}`,
        status: 'running',
      };
    } catch (error) {
      throw new HttpException(
        'Error starting route tracking',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get tracking system status
   */
  @Get('status')
  @ApiOperation({ summary: 'دریافت وضعیت سیستم ردیابی' })
  @ApiResponse({ status: 200, description: 'وضعیت سیستم ردیابی' })
  getTrackingStatus() {
    return this.automatedTracker.getTrackingStatus();
  }

  /**
   * Get tracking progress with visual progress bars
   */
  @Get('progress')
  @ApiOperation({ summary: 'دریافت پیشرفت ردیابی با نوار پیشرفت' })
  @ApiResponse({ status: 200, description: 'پیشرفت فعلی ردیابی با نوار پیشرفت' })
  getTrackingProgress() {
    return this.progressService.getProgressSummary();
  }

  /**
   * Get comprehensive price history for chart display
   */
  @Get('price-history/:flightNumber/:date/:origin/:destination')
  @ApiOperation({ summary: 'دریافت تاریخچه کامل قیمت پرواز برای نمودار' })
  @ApiParam({ name: 'flightNumber', description: 'شماره پرواز', example: '263' })
  @ApiParam({ name: 'date', description: 'تاریخ پرواز (YYYY-MM-DD)', example: '2025-01-15' })
  @ApiParam({ name: 'origin', description: 'مبدا', example: 'THR' })
  @ApiParam({ name: 'destination', description: 'مقصد', example: 'MHD' })
  @ApiResponse({ status: 200, description: 'تاریخچه کامل قیمت با گروه‌بندی تامین‌کننده' })
  async getComprehensivePriceHistory(
    @Param('flightNumber') flightNumber: string,
    @Param('date') date: string,
    @Param('origin') origin: string,
    @Param('destination') destination: string,
  ) {
    try {
      const flightDate = new Date(date);
      const history = await this.trackingService.getComprehensivePriceHistory(
        flightNumber,
        flightDate,
        origin,
        destination,
      );

      if (!history) {
        throw new HttpException('Flight not found or no price history available', HttpStatus.NOT_FOUND);
      }

      return history;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error fetching price history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get lowest price history for a specific flight
   */
  @Get('lowest-price/:flightNumber/:date/:origin/:destination')
  @ApiOperation({ summary: 'دریافت تاریخچه کمترین قیمت برای یک پرواز خاص' })
  @ApiParam({ name: 'flightNumber', description: 'شماره پرواز', example: '263' })
  @ApiParam({ name: 'date', description: 'تاریخ پرواز (YYYY-MM-DD)', example: '2025-01-15' })
  @ApiParam({ name: 'origin', description: 'مبدا', example: 'THR' })
  @ApiParam({ name: 'destination', description: 'مقصد', example: 'MHD' })
  @ApiResponse({ status: 200, description: 'تاریخچه کمترین قیمت' })
  async getLowestPriceHistory(
    @Param('flightNumber') flightNumber: string,
    @Param('date') date: string,
    @Param('origin') origin: string,
    @Param('destination') destination: string,
  ) {
    try {
      const flightDate = new Date(date);
      const history = await this.trackingService.getLowestPriceHistory(
        flightNumber,
        flightDate,
        origin,
        destination,
      );

      if (!history) {
        throw new HttpException('Flight not found', HttpStatus.NOT_FOUND);
      }

      return history;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error fetching lowest price history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get cheapest flights for a route in the next N days
   */
  @Get('cheapest/:origin/:destination')
  @ApiOperation({ summary: 'دریافت ارزان‌ترین پروازها برای یک مسیر' })
  @ApiParam({ name: 'origin', description: 'مبدا', example: 'THR' })
  @ApiParam({ name: 'destination', description: 'مقصد', example: 'MHD' })
  @ApiQuery({ name: 'daysAhead', required: false, description: 'تعداد روز جلو', example: 7 })
  @ApiResponse({ status: 200, description: 'لیست ارزان‌ترین پروازها' })
  async getCheapestFlights(
    @Param('origin') origin: string,
    @Param('destination') destination: string,
    @Query('daysAhead') daysAhead?: number,
  ) {
    try {
      const trends = await this.trackingService.getRoutePriceTrends(
        origin,
        destination,
        daysAhead || 7,
      );

      // Sort by current price and return top 10
      const cheapest = trends
        .filter((t) => t.current_price !== null)
        .sort((a, b) => Number(a.current_price) - Number(b.current_price))
        .slice(0, 10);

      return cheapest;
    } catch (error) {
      throw new HttpException(
        'Error fetching cheapest flights',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get price alerts - flights with significant price drops
   */
  @Get('alerts')
  @ApiOperation({ summary: 'دریافت هشدارهای کاهش قیمت' })
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'حداقل درصد کاهش قیمت',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'لیست پروازهایی با کاهش قیمت قابل توجه' })
  async getPriceAlerts(@Query('threshold') threshold?: number) {
    try {
      const minThreshold = threshold || 5; // Default 5% price drop

      const query = {
        start_date: new Date().toISOString().split('T')[0],
        limit: 100,
        page: 1,
      };

      const result = await this.trackingService.queryFlightPrices(query);

      // Filter flights with recent price drops
      const alerts = result.data
        .map((flight) => {
          const recentPrices = flight.price_history
            .sort((a, b) => b.scraped_at.getTime() - a.scraped_at.getTime())
            .slice(0, 2);

          if (recentPrices.length >= 2) {
            const priceChange = recentPrices[0].price_change_percentage;
            if (priceChange && priceChange < -minThreshold) {
              return {
                flight_number: flight.flight_number,
                flight_date: flight.flight_date,
                origin: flight.origin,
                destination: flight.destination,
                airline_name_fa: flight.airline_name_fa,
                current_price: recentPrices[0].adult_price,
                previous_price: recentPrices[1].adult_price,
                price_drop_percentage: priceChange,
                provider: recentPrices[0].provider,
              };
            }
          }
          return null;
        })
        .filter((alert) => alert !== null);

      return alerts;
    } catch (error) {
      throw new HttpException(
        'Error fetching price alerts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Pause the current tracking session
   */
  @Post('control/pause')
  @ApiOperation({ summary: 'توقف موقت ردیابی فعلی' })
  @ApiResponse({ status: 200, description: 'ردیابی متوقف شد' })
  async pauseTracking() {
    try {
      const result = await this.automatedTracker.pauseTracking();
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error pausing tracking',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Resume the paused tracking session
   */
  @Post('control/resume')
  @ApiOperation({ summary: 'ادامه ردیابی متوقف شده' })
  @ApiResponse({ status: 200, description: 'ردیابی از سر گرفته شد' })
  async resumeTracking() {
    try {
      const result = await this.automatedTracker.resumeTracking();
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error resuming tracking',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Stop the current tracking session
   */
  @Post('control/stop')
  @ApiOperation({ summary: 'متوقف کردن کامل ردیابی فعلی' })
  @ApiResponse({ status: 200, description: 'سیگنال توقف ارسال شد' })
  async stopTracking() {
    try {
      const result = await this.automatedTracker.stopTracking();
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error stopping tracking',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get scraping session history
   */
  @Get('sessions')
  @ApiOperation({ summary: 'دریافت تاریخچه جلسات ردیابی' })
  @ApiQuery({ name: 'page', required: false, description: 'شماره صفحه', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'تعداد در هر صفحه', example: 20 })
  @ApiResponse({ status: 200, description: 'لیست جلسات ردیابی' })
  async getSessionHistory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      return await this.sessionService.getSessionHistory(page || 1, limit || 20);
    } catch (error) {
      throw new HttpException(
        'Error fetching session history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get recent scraping sessions
   */
  @Get('sessions/recent')
  @ApiOperation({ summary: 'دریافت جلسات اخیر ردیابی' })
  @ApiQuery({ name: 'limit', required: false, description: 'تعداد جلسات', example: 10 })
  @ApiResponse({ status: 200, description: 'لیست جلسات اخیر' })
  async getRecentSessions(@Query('limit') limit?: number) {
    try {
      return await this.sessionService.getRecentSessions(limit || 10);
    } catch (error) {
      throw new HttpException(
        'Error fetching recent sessions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get active scraping session
   */
  @Get('sessions/active')
  @ApiOperation({ summary: 'دریافت جلسه فعال ردیابی' })
  @ApiResponse({ status: 200, description: 'جلسه فعال یا null' })
  async getActiveSession() {
    try {
      return await this.sessionService.getActiveSession();
    } catch (error) {
      throw new HttpException(
        'Error fetching active session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get session statistics
   */
  @Get('sessions/statistics')
  @ApiOperation({ summary: 'دریافت آمار جلسات ردیابی' })
  @ApiResponse({ status: 200, description: 'آمار کلی جلسات' })
  async getSessionStatistics() {
    try {
      return await this.sessionService.getSessionStatistics();
    } catch (error) {
      throw new HttpException(
        'Error fetching session statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get specific session by ID
   */
  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'دریافت اطلاعات یک جلسه خاص' })
  @ApiParam({ name: 'sessionId', description: 'شناسه جلسه' })
  @ApiResponse({ status: 200, description: 'اطلاعات جلسه' })
  async getSession(@Param('sessionId') sessionId: string) {
    try {
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }
      return session;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error fetching session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
