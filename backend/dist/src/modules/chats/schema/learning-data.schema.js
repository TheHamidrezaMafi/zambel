"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEARNINGDATA_MODEL_NAME = exports.LearningDataSchema = void 0;
const mongoose_1 = require("mongoose");
exports.LearningDataSchema = new mongoose_1.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});
exports.LEARNINGDATA_MODEL_NAME = 'LearningData';
//# sourceMappingURL=learning-data.schema.js.map