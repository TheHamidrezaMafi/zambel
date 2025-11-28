"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const chat_schema_1 = require("./schema/chat.schema");
const chats_service_1 = require("./services/chats.service");
const chat_controller_1 = require("./controllers/chat.controller");
const chatbot_service_1 = require("./services/chatbot.service");
const openai_service_1 = require("./services/openai.service");
const state_manager_1 = require("./managers/state-manager");
const travel_requests_service_1 = require("./services/travel-requests.service");
const travel_request_schema_1 = require("./schema/travel-request.schema");
const ai_service_1 = require("./services/ai.service");
const chat_gateway_1 = require("./gateways/chat.gateway");
const scraper_client_service_1 = require("./services/scraper-client.service");
const learning_data_schema_1 = require("./schema/learning-data.schema");
const config_1 = require("@nestjs/config");
let ChatsModule = class ChatsModule {
};
exports.ChatsModule = ChatsModule;
exports.ChatsModule = ChatsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: chat_schema_1.CHAT_MODEL_NAME, schema: chat_schema_1.ChatSchema }]),
            mongoose_1.MongooseModule.forFeature([
                { name: travel_request_schema_1.TRAVELREQUEST_MODEL_NAME, schema: travel_request_schema_1.TravelRequestSchema },
            ]),
            mongoose_1.MongooseModule.forFeature([
                { name: learning_data_schema_1.LEARNINGDATA_MODEL_NAME, schema: learning_data_schema_1.LearningDataSchema },
            ]),
            config_1.ConfigModule,
        ],
        providers: [
            chats_service_1.ChatsService,
            chatbot_service_1.ChatbotService,
            state_manager_1.StateManager,
            travel_requests_service_1.TravelRequestsService,
            ai_service_1.AIService,
            openai_service_1.OpenAIService,
            chat_gateway_1.ChatGateway,
            scraper_client_service_1.ScraperClientService,
        ],
        controllers: [chat_controller_1.ChatController],
        exports: [chatbot_service_1.ChatbotService, chats_service_1.ChatsService, scraper_client_service_1.ScraperClientService],
    })
], ChatsModule);
//# sourceMappingURL=chats.module.js.map