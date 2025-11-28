"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRAVELREQUEST_MODEL_NAME = exports.TravelRequestSchema = void 0;
const mongoose_1 = require("mongoose");
exports.TravelRequestSchema = new mongoose_1.Schema({
    userId: { type: Number, required: true },
    conversationId: { type: String, required: true },
    origin: { type: String, required: false },
    destination: { type: String, required: false },
    departureDate: { type: Date, required: false },
    returnDate: { type: Date, required: false },
    budget: { type: Number, required: false },
    timestamp: { type: Date, default: Date.now },
});
exports.TRAVELREQUEST_MODEL_NAME = 'TravelRequest';
//# sourceMappingURL=travel-request.schema.js.map