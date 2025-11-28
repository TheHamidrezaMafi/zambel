"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEEDBACK_MODEL_NAME = exports.FeedbackSchema = void 0;
const mongoose_1 = require("mongoose");
exports.FeedbackSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    feedback: { type: String, enum: ['like', 'dislike'], required: true },
    timestamp: { type: Date, default: Date.now },
});
exports.FEEDBACK_MODEL_NAME = 'Feedback';
//# sourceMappingURL=feedback.schema.js.map