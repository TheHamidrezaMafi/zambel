"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_MODEL_NAME = exports.ChatSchema = void 0;
const mongoose_1 = require("mongoose");
exports.ChatSchema = new mongoose_1.Schema({
    userId: { type: Number, required: true },
    conversationId: { type: String, required: true },
    message: { type: String, required: true },
    sender: { type: String, enum: ['user', 'bot'], required: true },
    timestamp: { type: Date, default: Date.now },
    topic: { type: String, required: false },
});
exports.CHAT_MODEL_NAME = 'Chat';
//# sourceMappingURL=chat.schema.js.map