"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingProviders = void 0;
const constants_1 = require("../../../core/constants");
const booking_entity_1 = require("../models/booking.entity");
exports.bookingProviders = [{
        provide: constants_1.BOOKING,
        useValue: booking_entity_1.Booking,
    }];
//# sourceMappingURL=booking.providers.js.map