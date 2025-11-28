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
exports.AIService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const chat_schema_1 = require("../schema/chat.schema");
const mongoose_2 = require("mongoose");
const learning_data_schema_1 = require("../schema/learning-data.schema");
const openai_service_1 = require("./openai.service");
let AIService = class AIService {
    constructor(chatModel, learningDataModel, openaiService) {
        this.chatModel = chatModel;
        this.learningDataModel = learningDataModel;
        this.openaiService = openaiService;
        this.predefinedResponses = {
            سلام: 'سلام! چطور می‌تونم کمک‌تون کنم؟',
            خداحافظ: 'خداحافظ! سفر خوبی داشته باشید.',
        };
        this.loadModel();
    }
    async loadModel() {
    }
    async getResponse(userId, message) {
        const similarMessages = await this.learningDataModel
            .find({ input: { $regex: message, $options: 'i' } })
            .exec();
        if (similarMessages.length > 0) {
            return similarMessages[0].output;
        }
        const response = await this.openaiService.getResponse(message);
        const learningData = new this.learningDataModel({
            input: message,
            output: response,
        });
        await learningData.save();
        return response;
    }
    getPredefinedResponse(message) {
        return this.predefinedResponses[message] || null;
    }
    async trainModel() {
    }
};
exports.AIService = AIService;
exports.AIService = AIService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_schema_1.CHAT_MODEL_NAME)),
    __param(1, (0, mongoose_1.InjectModel)(learning_data_schema_1.LEARNINGDATA_MODEL_NAME)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        openai_service_1.OpenAIService])
], AIService);
//# sourceMappingURL=ai.service.js.map