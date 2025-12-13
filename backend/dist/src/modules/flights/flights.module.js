"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const flights_controller_1 = require("./controllers/flights.controller");
const flight_tracking_controller_1 = require("./controllers/flight-tracking.controller");
const flights_stream_controller_1 = require("./controllers/flights-stream.controller");
const flights_service_1 = require("./services/flights.service");
const flight_tracking_service_1 = require("./services/flight-tracking.service");
const automated_flight_tracker_service_1 = require("./services/automated-flight-tracker.service");
const flight_aggregation_service_1 = require("./services/flight-aggregation.service");
const price_history_tracker_service_1 = require("./services/price-history-tracker.service");
const flight_tracking_progress_service_1 = require("./services/flight-tracking-progress.service");
const scraping_session_service_1 = require("./services/scraping-session.service");
const flight_stream_service_1 = require("./services/flight-stream.service");
const flight_provider_1 = require("./providers/flight.provider");
const scraper_module_1 = require("../scraper/scraper.module");
const postgres_module_1 = require("../../core/database/postgres.module");
const flight_database_repository_1 = require("./repositories/flight-database.repository");
const tracked_flight_entity_1 = require("./models/tracked-flight.entity");
const flight_price_history_entity_1 = require("./models/flight-price-history.entity");
const lowest_price_snapshot_entity_1 = require("./models/lowest-price-snapshot.entity");
const route_config_entity_1 = require("./models/route-config.entity");
const scraping_session_entity_1 = require("./models/scraping-session.entity");
let FlightsModule = class FlightsModule {
};
exports.FlightsModule = FlightsModule;
exports.FlightsModule = FlightsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([tracked_flight_entity_1.TrackedFlight, flight_price_history_entity_1.FlightPriceHistory, lowest_price_snapshot_entity_1.LowestPriceSnapshot, route_config_entity_1.RouteConfig, scraping_session_entity_1.ScrapingSession]),
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
            scraper_module_1.ScraperModule,
            postgres_module_1.PostgresModule,
        ],
        controllers: [flights_controller_1.FlightsController, flight_tracking_controller_1.FlightTrackingController, flights_stream_controller_1.FlightsStreamController],
        providers: [
            flights_service_1.FlightsService,
            flight_tracking_service_1.FlightTrackingService,
            automated_flight_tracker_service_1.AutomatedFlightTrackerService,
            flight_aggregation_service_1.FlightAggregationService,
            price_history_tracker_service_1.PriceHistoryTrackerService,
            flight_tracking_progress_service_1.FlightTrackingProgressService,
            scraping_session_service_1.ScrapingSessionService,
            flight_stream_service_1.FlightStreamService,
            flight_database_repository_1.FlightDatabaseRepository,
            ...flight_provider_1.flightProviders,
        ],
        exports: [flights_service_1.FlightsService, flight_tracking_service_1.FlightTrackingService, flight_database_repository_1.FlightDatabaseRepository, flight_aggregation_service_1.FlightAggregationService, price_history_tracker_service_1.PriceHistoryTrackerService],
    })
], FlightsModule);
//# sourceMappingURL=flights.module.js.map