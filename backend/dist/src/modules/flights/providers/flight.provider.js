"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flightProviders = void 0;
const constants_1 = require("../../../core/constants");
const flight_entity_1 = require("../models/flight.entity");
exports.flightProviders = [{
        provide: constants_1.FLIGHT_REPOSITORY,
        useValue: flight_entity_1.Flights,
    }];
//# sourceMappingURL=flight.provider.js.map