"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FlightsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightsService = void 0;
const common_1 = require("@nestjs/common");
const scraper_http_service_1 = require("../../scraper/services/scraper-http.service");
const flight_database_repository_1 = require("../repositories/flight-database.repository");
const flight_aggregation_service_1 = require("./flight-aggregation.service");
let FlightsService = FlightsService_1 = class FlightsService {
    constructor(scraperService, flightDatabase, aggregationService) {
        this.scraperService = scraperService;
        this.flightDatabase = flightDatabase;
        this.aggregationService = aggregationService;
        this.logger = new common_1.Logger(FlightsService_1.name);
    }
    async searchFlight(data) {
        var _a;
        try {
            this.logger.log('=== searchFlight called ===', {
                hasProviderName: !!data.provider_name,
                hasRequests: !!data.requests,
                hasOrigin: !!data.origin,
                requestsLength: (_a = data.requests) === null || _a === void 0 ? void 0 : _a.length
            });
            let searchData = data;
            if (data.data && data.data.requests && Array.isArray(data.data.requests) && data.data.requests.length > 0) {
                searchData = data.data.requests[0];
            }
            else if (data.requests && Array.isArray(data.requests) && data.requests.length > 0) {
                searchData = data.requests[0];
                this.logger.log('Using old frontend format, extracted first request', { searchData });
            }
            const origin = data.origin || searchData.from_destination || searchData.origin;
            const destination = data.destination || searchData.to_destination || searchData.destination;
            const startDate = data.start_date || searchData.from_date || searchData.start_date || data.departureDate || data.departure_date;
            this.logger.log('Parameter extraction', {
                origin, destination, startDate,
                from_data: { origin: data.origin, destination: data.destination, start_date: data.start_date },
                from_searchData: { from_destination: searchData.from_destination, to_destination: searchData.to_destination, from_date: searchData.from_date }
            });
            const returnDate = data.return_date || searchData.to_date || data.returnDate;
            const userId = data.requested_by_user_id || searchData.requested_by_user_id || data.user_id || '1';
            this.logger.debug('Request format detection', {
                hasDataRequests: !!(data.data && data.data.requests),
                hasRequests: !!(data.requests),
                hasDirect: !!(data.origin && data.destination),
                searchData: searchData !== data ? 'extracted from requests' : 'using data directly'
            });
            this.logger.debug('Extracted parameters', { origin, destination, startDate, returnDate, userId });
            if (!origin || !destination || !startDate) {
                this.logger.error('Missing required search parameters', { origin, destination, startDate, searchData, originalData: data });
                return {
                    flights: [],
                    metadata: {
                        total_flights: 0,
                        total_options: 0,
                        providers_queried: [],
                        providers_successful: [],
                        providers_failed: [],
                        search_time_ms: 0,
                        cached: false,
                        error: 'Missing required parameters: origin, destination, start_date',
                    },
                    pagination: {
                        total: 0,
                        page: 1,
                        limit: 50,
                        pages: 0,
                    },
                };
            }
            this.logger.log(`Flight search: ${origin} → ${destination} on ${startDate}`);
            const result = await this.aggregationService.searchFlights(origin, destination, startDate, returnDate, userId);
            this.logger.log(`Search completed: ${result.metadata.total_flights} flights, ${result.metadata.total_options} options`);
            return result;
        }
        catch (error) {
            this.logger.error('Flight search failed:', error);
            return {
                flights: [],
                metadata: {
                    total_flights: 0,
                    total_options: 0,
                    providers_queried: [],
                    providers_successful: [],
                    providers_failed: [],
                    search_time_ms: 0,
                    cached: false,
                    error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error',
                },
            };
        }
    }
    async searchFlightLegacy(data) {
        try {
            if (data.provider_name !== undefined && data.requests) {
                return this.scraperService.takeRequests(data);
            }
            const scraperRequest = {
                provider_name: '',
                requests: [
                    {
                        requested_by_user_id: '1',
                        from_date: data.start_date,
                        to_date: data.return_date || data.start_date,
                        from_destination: data.origin,
                        to_destination: data.destination,
                        is_foreign_flight: false,
                        type: '1',
                    },
                ],
            };
            return this.scraperService.takeRequests(scraperRequest);
        }
        catch (error) {
            this.logger.error('Legacy flight search failed:', error);
            return { flights: [] };
        }
    }
    async searchFlightEnhanced(searchDto) {
        var _a;
        const startTime = Date.now();
        try {
            const dbFlights = await this.flightDatabase.findCheapestFlights(searchDto.origin, searchDto.destination, searchDto.departure_date, searchDto.return_date || searchDto.departure_date, 50);
            const hasRecentData = dbFlights.length > 0 && this.isDataFresh(dbFlights);
            if (hasRecentData) {
                this.logger.log(`Returning ${dbFlights.length} cached flights from database`);
                return {
                    flights: dbFlights,
                    total: dbFlights.length,
                    source: 'database',
                    cached: true,
                    cache_age_minutes: this.getCacheAgeMinutes(dbFlights),
                    response_time_ms: Date.now() - startTime,
                };
            }
            this.logger.log('No fresh data in database, triggering scraper...');
            const scraperRequest = {
                provider_name: searchDto.provider || '',
                requests: [
                    {
                        requested_by_user_id: '1',
                        from_date: searchDto.departure_date,
                        to_date: searchDto.return_date || searchDto.departure_date,
                        from_destination: searchDto.origin,
                        to_destination: searchDto.destination,
                        is_foreign_flight: false,
                        type: '1',
                    },
                ],
            };
            const scraperResult = await this.scraperService.takeRequests(scraperRequest);
            return {
                flights: scraperResult.flights || [],
                total: ((_a = scraperResult.flights) === null || _a === void 0 ? void 0 : _a.length) || 0,
                source: 'scraper',
                cached: false,
                response_time_ms: Date.now() - startTime,
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error in searchFlightEnhanced: ${err.message}`, err.stack);
            throw error;
        }
    }
    isDataFresh(flights) {
        if (!flights || flights.length === 0)
            return false;
        const mostRecent = flights.reduce((latest, flight) => {
            const flightTime = new Date(flight.last_seen_at || flight.scraped_at).getTime();
            const latestTime = new Date(latest.last_seen_at || latest.scraped_at).getTime();
            return flightTime > latestTime ? flight : latest;
        }, flights[0]);
        const ageMinutes = (Date.now() - new Date(mostRecent.last_seen_at || mostRecent.scraped_at).getTime()) / 60000;
        return ageMinutes < 60;
    }
    getCacheAgeMinutes(flights) {
        if (!flights || flights.length === 0)
            return 0;
        const mostRecent = flights.reduce((latest, flight) => {
            const flightTime = new Date(flight.last_seen_at || flight.scraped_at).getTime();
            const latestTime = new Date(latest.last_seen_at || latest.scraped_at).getTime();
            return flightTime > latestTime ? flight : latest;
        }, flights[0]);
        return Math.round((Date.now() - new Date(mostRecent.last_seen_at || mostRecent.scraped_at).getTime()) / 60000);
    }
    async getPriceHistory(baseFlightId, hoursBack = 168) {
        try {
            const history = await this.flightDatabase.getFlightPriceHistory(baseFlightId, hoursBack);
            return {
                base_flight_id: baseFlightId,
                history,
                total_snapshots: history.length,
                hours_back: hoursBack,
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error getting price history: ${err.message}`);
            throw error;
        }
    }
    async getPriceChanges(baseFlightId, hoursBack = 168) {
        try {
            const changes = await this.flightDatabase.getFlightPriceChanges(baseFlightId, hoursBack);
            return {
                base_flight_id: baseFlightId,
                changes,
                total_changes: changes.length,
                hours_back: hoursBack,
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error getting price changes: ${err.message}`);
            throw error;
        }
    }
    async getDailyStats(baseFlightId) {
        try {
            const stats = await this.flightDatabase.getFlightDailyStats(baseFlightId);
            const insights = this.calculatePriceInsights(stats);
            return {
                base_flight_id: baseFlightId,
                daily_stats: stats,
                insights,
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error getting daily stats: ${err.message}`);
            throw error;
        }
    }
    calculatePriceInsights(stats) {
        if (!stats || stats.length === 0) {
            return null;
        }
        const prices = stats.map(s => s.avg_price).filter(p => p != null);
        const volatilities = stats.map(s => s.price_volatility).filter(v => v != null);
        return {
            overall_min: Math.min(...prices),
            overall_max: Math.max(...prices),
            overall_avg: prices.reduce((a, b) => a + b, 0) / prices.length,
            avg_volatility: volatilities.reduce((a, b) => a + b, 0) / volatilities.length,
            trend: this.calculateTrend(prices),
            recommendation: this.generateRecommendation(stats),
        };
    }
    calculateTrend(prices) {
        if (prices.length < 2)
            return 'insufficient_data';
        const recentPrices = prices.slice(-3);
        const avgRecent = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
        const avgOlder = prices.slice(0, -3).reduce((a, b) => a + b, 0) / (prices.length - 3);
        const change = ((avgRecent - avgOlder) / avgOlder) * 100;
        if (change > 5)
            return 'increasing';
        if (change < -5)
            return 'decreasing';
        return 'stable';
    }
    generateRecommendation(stats) {
        if (!stats || stats.length < 2) {
            return 'Insufficient data for recommendation';
        }
        const latest = stats[stats.length - 1];
        const oldest = stats[0];
        const priceChange = ((latest.avg_price - oldest.avg_price) / oldest.avg_price) * 100;
        const capacityChange = latest.max_capacity - oldest.max_capacity;
        if (priceChange < -10 && capacityChange > 0) {
            return 'Excellent time to book! Price is dropping and seats are available.';
        }
        else if (priceChange > 10 && capacityChange < -5) {
            return 'Book soon! Prices are rising and capacity is decreasing.';
        }
        else if (capacityChange < -10) {
            return 'Book now! Seats are filling up quickly.';
        }
        else if (priceChange < 0) {
            return 'Good time to book. Price is lower than usual.';
        }
        else {
            return 'Monitor prices. Consider waiting for a better deal.';
        }
    }
    async getPriceComparison(baseFlightId) {
        try {
            const comparison = await this.flightDatabase.getFlightPriceComparison(baseFlightId);
            const bestDeal = comparison.reduce((best, current) => {
                return current.adult_total_fare < best.adult_total_fare ? current : best;
            }, comparison[0]);
            return {
                base_flight_id: baseFlightId,
                providers: comparison,
                best_deal: bestDeal,
                price_difference: comparison.length > 1
                    ? Math.max(...comparison.map(c => c.adult_total_fare)) - Math.min(...comparison.map(c => c.adult_total_fare))
                    : 0,
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error getting price comparison: ${err.message}`);
            throw error;
        }
    }
    async getCapacityTrend(baseFlightId, hoursBack = 168) {
        try {
            const trend = await this.flightDatabase.getCapacityTrend(baseFlightId, hoursBack);
            const bookingRate = this.calculateBookingRate(trend);
            return {
                base_flight_id: baseFlightId,
                capacity_trend: trend,
                booking_rate: bookingRate,
                urgency_level: this.assessUrgency(trend),
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error getting capacity trend: ${err.message}`);
            throw error;
        }
    }
    calculateBookingRate(trend) {
        if (!trend || trend.length < 2)
            return 0;
        const totalCapacityChange = trend.reduce((sum, point) => sum + Math.abs(point.capacity_change), 0);
        const totalHours = (new Date(trend[0].scraped_at).getTime() - new Date(trend[trend.length - 1].scraped_at).getTime()) / 3600000;
        return totalHours > 0 ? totalCapacityChange / totalHours : 0;
    }
    assessUrgency(trend) {
        if (!trend || trend.length === 0)
            return 'unknown';
        const latest = trend[0];
        const bookingRate = this.calculateBookingRate(trend);
        if (latest.capacity < 5)
            return 'critical';
        if (bookingRate > 2 && latest.capacity < 20)
            return 'high';
        if (bookingRate > 1)
            return 'moderate';
        return 'low';
    }
    async getPriceDrops(origin, destination, dates, threshold = 10) {
        try {
            const drops = await this.flightDatabase.getPriceDrops(origin, destination, dates, threshold);
            return {
                route: `${origin} → ${destination}`,
                dates,
                threshold_percent: threshold,
                price_drops: drops,
                total_alerts: drops.length,
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error getting price drops: ${err.message}`);
            throw error;
        }
    }
    async getScrapingStats(hoursBack = 24) {
        try {
            const stats = await this.flightDatabase.getScrapingStats(hoursBack);
            return {
                period_hours: hoursBack,
                providers: stats,
                total_scrapes: stats.reduce((sum, s) => sum + s.scrape_count, 0),
                total_flights: stats.reduce((sum, s) => sum + s.flights_found, 0),
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error getting scraping stats: ${err.message}`);
            throw error;
        }
    }
    async getFlightDetails(baseFlightId) {
        try {
            const flight = await this.flightDatabase.getFlightByBaseId(baseFlightId);
            if (!flight) {
                return null;
            }
            const latestSnapshot = await this.flightDatabase.getLatestFlightSnapshot(baseFlightId);
            const priceComparison = await this.flightDatabase.getFlightPriceComparison(baseFlightId);
            const dailyStats = await this.flightDatabase.getFlightDailyStats(baseFlightId);
            return {
                base_flight_id: baseFlightId,
                flight_info: flight,
                current_pricing: latestSnapshot,
                price_comparison: priceComparison,
                daily_stats: dailyStats.slice(0, 7),
                last_updated: latestSnapshot === null || latestSnapshot === void 0 ? void 0 : latestSnapshot.scraped_at,
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error getting flight details: ${err.message}`);
            throw error;
        }
    }
};
exports.FlightsService = FlightsService;
exports.FlightsService = FlightsService = FlightsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scraper_http_service_1.ScraperHttpService,
        flight_database_repository_1.FlightDatabaseRepository,
        flight_aggregation_service_1.FlightAggregationService])
], FlightsService);
//# sourceMappingURL=flights.service.js.map