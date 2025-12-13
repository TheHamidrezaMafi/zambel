import { Body, Controller, Post, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FlightsService } from '../services/flights.service';
import { FlightSearchDTO } from '../dto/flight.dto';
import {
  FlightSearchDto,
  PriceHistoryQueryDto,
  PriceDropQueryDto,
  ScrapingStatsQueryDto,
} from '../dto/flight-search.dto';
import {
  FlightSearchResponseDto,
  PriceHistoryPointDto,
  PriceChangeDto,
  DailyStatsDto,
  ProviderComparisonDto,
  CapacityTrendDto,
  PriceDropDto,
  ScrapingStatsDto,
} from '../dto/flight-response.dto';

@Controller('flights')
@ApiTags('flights')
export class FlightsController {
  constructor(private flightService: FlightsService) {}

  /**
   * LEGACY ENDPOINT - Maintained for backward compatibility
   * Uses old FlightSearchDTO format
   */
  @Post('search')
  @ApiOperation({ summary: 'جستجوی پرواز (Legacy)' })
  @ApiResponse({ status: 400, description: 'داده‌های جستجو نامعتبر است.' })
  @ApiResponse({ status: 200, description: 'The response from the chatbot' })
  searchFlight(@Body() document: FlightSearchDTO) {
    return this.flightService.searchFlight(document);
  }

  /**
   * NEW ENHANCED ENDPOINT - Returns unified format with database caching
   */
  @Post('search-enhanced')
  @ApiOperation({ 
    summary: 'Enhanced Flight Search', 
    description: 'Search flights with database caching and unified format. Checks database first for recent results (< 1 hour), then falls back to scraper if needed.' 
  })
  @ApiResponse({ status: 200, type: FlightSearchResponseDto })
  searchFlightEnhanced(@Body() searchDto: FlightSearchDto) {
    return this.flightService.searchFlightEnhanced(searchDto);
  }

  /**
   * Get complete price history for a flight
   */
  @Get('price-history/:baseFlightId')
  @ApiOperation({ 
    summary: 'Get Price History', 
    description: 'Get complete price history for a flight showing all price snapshots over time' 
  })
  @ApiResponse({ status: 200, type: [PriceHistoryPointDto] })
  getPriceHistory(
    @Param('baseFlightId') baseFlightId: string,
    @Query() query: PriceHistoryQueryDto,
  ) {
    if (query.changes_only) {
      return this.flightService.getPriceChanges(baseFlightId, query.hours_back);
    }
    return this.flightService.getPriceHistory(baseFlightId, query.hours_back);
  }

  /**
   * Get only price changes (not all snapshots)
   */
  @Get('price-changes/:baseFlightId')
  @ApiOperation({ 
    summary: 'Get Price Changes', 
    description: 'Get only price changes for a flight (excludes snapshots with no price/capacity change)' 
  })
  @ApiResponse({ status: 200, type: [PriceChangeDto] })
  getPriceChanges(
    @Param('baseFlightId') baseFlightId: string,
    @Query() query: PriceHistoryQueryDto,
  ) {
    return this.flightService.getPriceChanges(baseFlightId, query.hours_back);
  }

  /**
   * Get daily statistics for a flight
   */
  @Get('daily-stats/:baseFlightId')
  @ApiOperation({ 
    summary: 'Get Daily Statistics', 
    description: 'Get daily min/max/avg prices and volatility for a flight' 
  })
  @ApiResponse({ status: 200, type: [DailyStatsDto] })
  getDailyStats(@Param('baseFlightId') baseFlightId: string) {
    return this.flightService.getDailyStats(baseFlightId);
  }

  /**
   * Compare prices across providers
   */
  @Get('price-comparison/:baseFlightId')
  @ApiOperation({ 
    summary: 'Compare Prices Across Providers', 
    description: 'Get latest price from each provider for comparison' 
  })
  @ApiResponse({ status: 200, type: [ProviderComparisonDto] })
  getPriceComparison(@Param('baseFlightId') baseFlightId: string) {
    return this.flightService.getPriceComparison(baseFlightId);
  }

  /**
   * Get capacity trend (booking velocity)
   */
  @Get('capacity-trend/:baseFlightId')
  @ApiOperation({ 
    summary: 'Get Capacity Trend', 
    description: 'Track available capacity over time to estimate booking velocity' 
  })
  @ApiResponse({ status: 200, type: [CapacityTrendDto] })
  getCapacityTrend(
    @Param('baseFlightId') baseFlightId: string,
    @Query() query: PriceHistoryQueryDto,
  ) {
    return this.flightService.getCapacityTrend(baseFlightId, query.hours_back);
  }

  /**
   * Find recent price drops for alerts
   */
  @Post('price-drops')
  @ApiOperation({ 
    summary: 'Find Price Drops', 
    description: 'Find flights with significant recent price drops for alert generation' 
  })
  @ApiResponse({ status: 200, type: [PriceDropDto] })
  getPriceDrops(@Body() query: PriceDropQueryDto) {
    return this.flightService.getPriceDrops(
      query.origin,
      query.destination,
      query.dates,
      query.threshold,
    );
  }

  /**
   * Get scraping performance statistics
   */
  @Get('stats')
  @ApiOperation({ 
    summary: 'Get Scraping Statistics', 
    description: 'Get scraping performance metrics (count, frequency, etc.) by provider' 
  })
  @ApiResponse({ status: 200, type: [ScrapingStatsDto] })
  getScrapingStats(@Query() query: ScrapingStatsQueryDto) {
    return this.flightService.getScrapingStats(query.hours_back);
  }

  /**
   * Get flight details by base_flight_id
   */
  @Get('details/:baseFlightId')
  @ApiOperation({ 
    summary: 'Get Flight Details', 
    description: 'Get complete flight information including latest pricing and availability' 
  })
  getFlightDetails(@Param('baseFlightId') baseFlightId: string) {
    return this.flightService.getFlightDetails(baseFlightId);
  }
}
