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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const flights_service_1 = require("../services/flights.service");
const flight_dto_1 = require("../dto/flight.dto");
const flight_search_dto_1 = require("../dto/flight-search.dto");
const flight_response_dto_1 = require("../dto/flight-response.dto");
let FlightsController = class FlightsController {
    constructor(flightService) {
        this.flightService = flightService;
    }
    searchFlight(document) {
        return this.flightService.searchFlight(document);
    }
    searchFlightEnhanced(searchDto) {
        return this.flightService.searchFlightEnhanced(searchDto);
    }
    getPriceHistory(baseFlightId, query) {
        if (query.changes_only) {
            return this.flightService.getPriceChanges(baseFlightId, query.hours_back);
        }
        return this.flightService.getPriceHistory(baseFlightId, query.hours_back);
    }
    getPriceChanges(baseFlightId, query) {
        return this.flightService.getPriceChanges(baseFlightId, query.hours_back);
    }
    getDailyStats(baseFlightId) {
        return this.flightService.getDailyStats(baseFlightId);
    }
    getPriceComparison(baseFlightId) {
        return this.flightService.getPriceComparison(baseFlightId);
    }
    getCapacityTrend(baseFlightId, query) {
        return this.flightService.getCapacityTrend(baseFlightId, query.hours_back);
    }
    getPriceDrops(query) {
        return this.flightService.getPriceDrops(query.origin, query.destination, query.dates, query.threshold);
    }
    getScrapingStats(query) {
        return this.flightService.getScrapingStats(query.hours_back);
    }
    getFlightDetails(baseFlightId) {
        return this.flightService.getFlightDetails(baseFlightId);
    }
};
exports.FlightsController = FlightsController;
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'جستجوی پرواز (Legacy)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'داده‌های جستجو نامعتبر است.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The response from the chatbot' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flight_dto_1.FlightSearchDTO]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "searchFlight", null);
__decorate([
    (0, common_1.Post)('search-enhanced'),
    (0, swagger_1.ApiOperation)({
        summary: 'Enhanced Flight Search',
        description: 'Search flights with database caching and unified format. Checks database first for recent results (< 1 hour), then falls back to scraper if needed.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: flight_response_dto_1.FlightSearchResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flight_search_dto_1.FlightSearchDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "searchFlightEnhanced", null);
__decorate([
    (0, common_1.Get)('price-history/:baseFlightId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Price History',
        description: 'Get complete price history for a flight showing all price snapshots over time'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [flight_response_dto_1.PriceHistoryPointDto] }),
    __param(0, (0, common_1.Param)('baseFlightId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, flight_search_dto_1.PriceHistoryQueryDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getPriceHistory", null);
__decorate([
    (0, common_1.Get)('price-changes/:baseFlightId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Price Changes',
        description: 'Get only price changes for a flight (excludes snapshots with no price/capacity change)'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [flight_response_dto_1.PriceChangeDto] }),
    __param(0, (0, common_1.Param)('baseFlightId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, flight_search_dto_1.PriceHistoryQueryDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getPriceChanges", null);
__decorate([
    (0, common_1.Get)('daily-stats/:baseFlightId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Daily Statistics',
        description: 'Get daily min/max/avg prices and volatility for a flight'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [flight_response_dto_1.DailyStatsDto] }),
    __param(0, (0, common_1.Param)('baseFlightId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getDailyStats", null);
__decorate([
    (0, common_1.Get)('price-comparison/:baseFlightId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Compare Prices Across Providers',
        description: 'Get latest price from each provider for comparison'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [flight_response_dto_1.ProviderComparisonDto] }),
    __param(0, (0, common_1.Param)('baseFlightId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getPriceComparison", null);
__decorate([
    (0, common_1.Get)('capacity-trend/:baseFlightId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Capacity Trend',
        description: 'Track available capacity over time to estimate booking velocity'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [flight_response_dto_1.CapacityTrendDto] }),
    __param(0, (0, common_1.Param)('baseFlightId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, flight_search_dto_1.PriceHistoryQueryDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getCapacityTrend", null);
__decorate([
    (0, common_1.Post)('price-drops'),
    (0, swagger_1.ApiOperation)({
        summary: 'Find Price Drops',
        description: 'Find flights with significant recent price drops for alert generation'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [flight_response_dto_1.PriceDropDto] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flight_search_dto_1.PriceDropQueryDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getPriceDrops", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Scraping Statistics',
        description: 'Get scraping performance metrics (count, frequency, etc.) by provider'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [flight_response_dto_1.ScrapingStatsDto] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flight_search_dto_1.ScrapingStatsQueryDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getScrapingStats", null);
__decorate([
    (0, common_1.Get)('details/:baseFlightId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Flight Details',
        description: 'Get complete flight information including latest pricing and availability'
    }),
    __param(0, (0, common_1.Param)('baseFlightId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getFlightDetails", null);
exports.FlightsController = FlightsController = __decorate([
    (0, common_1.Controller)('flights'),
    (0, swagger_1.ApiTags)('flights'),
    __metadata("design:paramtypes", [flights_service_1.FlightsService])
], FlightsController);
//# sourceMappingURL=flights.controller.js.map