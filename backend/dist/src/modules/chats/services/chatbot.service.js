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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const openai_service_1 = require("./openai.service");
const state_manager_1 = require("../managers/state-manager");
const ai_service_1 = require("./ai.service");
const chats_service_1 = require("./chats.service");
const travel_requests_service_1 = require("./travel-requests.service");
const cities_1 = require("../cities");
const date_utils_1 = require("../utils/date-utils");
const budget_utils_1 = require("../utils/budget-utils");
const scraper_client_service_1 = require("./scraper-client.service");
let ChatbotService = class ChatbotService {
    constructor(openaiService, stateManager, aiService, chatsService, travelRequestsService, scraperClientService) {
        this.openaiService = openaiService;
        this.stateManager = stateManager;
        this.aiService = aiService;
        this.chatsService = chatsService;
        this.travelRequestsService = travelRequestsService;
        this.scraperClientService = scraperClientService;
    }
    async handleMessage(_a) {
        var _b;
        var { userId, message } = _a, body = __rest(_a, ["userId", "message"]);
        const state = this.stateManager.getState(userId);
        let response;
        let conversationId = (body === null || body === void 0 ? void 0 : body.conversationId) || ((_b = state[0]) === null || _b === void 0 ? void 0 : _b.conversationId);
        if (conversationId) {
            response = await this.openaiService.try_converstion(conversationId, message);
        }
        else {
            response = await this.openaiService.getResponse(message);
            conversationId = response['id'];
        }
        console.log(response, 'pppppppp');
        if (!response) {
            return new common_1.HttpException({
                message: 'خطایی در عملیات بوجود آمده است',
                status: 400
            }, 400);
        }
        await this.chatsService.saveMessage(userId, conversationId, message, 'user');
        await this.chatsService.saveMessage(userId, conversationId, typeof response == 'string' ? response : response['content'], 'bot');
        if (response['content'].includes('destination=')) {
            this.sendToScraper(response['content']);
        }
        if (typeof response != 'string') {
            response['content'] = response['content'].replace(/\n\n```\n\"destination=.*\"\n```\n\n/g, '');
        }
        await this.updateTravelRequest(conversationId, message);
        return response;
    }
    async getChatResponse(message, userId) {
        const state = this.stateManager.getState(userId)[0];
        let prompt = '';
        if (!state.step) {
            prompt = `کاربر جدید وارد شده است. به او خوش‌آمد بگو و از او بپرس به کجا می‌خواهد سفر کند.`;
            state.step = 'destination';
        }
        else if (state.step === 'destination') {
            if (message.includes('سفر')) {
                const destination = this.extractDestination(message);
                prompt = `کاربر می‌خواهد به ${destination} سفر کند. اطلاعات کامل‌تری در مورد سفر به ${destination} ارائه بده.`;
                state.step = 'info';
            }
            else {
                prompt = `کاربر می‌خواهد به ${message} سفر کند. از او بپرس تاریخ سفر را انتخاب کند.`;
                state.step = 'date';
            }
        }
        else if (state.step === 'info') {
            prompt = `کاربر درخواست اطلاعات بیشتر کرده است. اطلاعات کامل‌تری در مورد سفر به ${state.destination} ارائه بده.`;
            state.step = 'complete';
        }
        else if (state.step === 'date') {
            prompt = `کاربر تاریخ سفر را انتخاب کرده است (${message}). از او بپرس بودجه سفر چقدر است.`;
            state.step = 'budget';
        }
        else if (state.step === 'budget') {
            prompt = `کاربر بودجه سفر را مشخص کرده است (${message}). اطلاعات را جمع‌آوری کن و پیشنهادات هتل و پرواز را ارائه بده.`;
            state.step = 'complete';
        }
        this.stateManager.setState(userId, state);
        const response = await this.openaiService.getResponse(prompt);
        return response;
    }
    isHotelOrFlightRequest(message) {
        return message.includes('هتل') || message.includes('پرواز');
    }
    async sendToScraper(travelRequest) {
        const regex = /"([^"]+)"/;
        const match = travelRequest.match(regex);
        if (match && match[1]) {
            const extractedString = match[1];
            const queryObject = extractedString.split('&').reduce((acc, pair) => {
                const [key, value] = pair.split('=');
                acc[key] = value;
                return acc;
            }, {});
            console.log(extractedString, 'extractedString');
            if (extractedString.includes('is_hotel')) {
                this.searchHotels(Object.assign(queryObject, {
                    checkinDate: queryObject['departing'],
                    checkoutDate: queryObject['last_date']
                }));
            }
            if (extractedString.includes('is_flight')) {
                this.searchFlights(queryObject['origin'], queryObject['destination'], queryObject['departing'], queryObject['last_date']);
            }
            console.log(extractedString);
        }
        else {
            console.log("رشته مورد نظر یافت نشد.");
        }
    }
    async searchHotels(queryObject) {
        return this.scraperClientService.searchHotels(queryObject);
    }
    async searchFlights(origin, destination, date, return_date = undefined) {
        return this.scraperClientService.searchFlights(origin, destination, date, return_date, {});
    }
    extractDestination(message) {
        const destinations = ['شیراز', 'تهران', 'مشهد', 'اصفهان'];
        for (const destination of destinations) {
            if (message.includes(destination)) {
                return destination;
            }
        }
        return 'مقصد نامشخص';
    }
    isTravelInfo(message) {
        const res = message.includes('شهر مبدأ') ||
            message.includes('شهر مقصد') ||
            message.includes('تاریخ حرکت') ||
            message.includes('تاریخ برگشت') ||
            message.includes('بودجه');
        return res;
    }
    isTravelInfoComplete(travelInfo) {
        return (travelInfo.origin &&
            travelInfo.destination &&
            travelInfo.departureDate &&
            travelInfo.returnDate &&
            travelInfo.budget);
    }
    async updateTravelRequest(conversationId, message) {
        const travelInfo = this.extractTravelInfo(message);
        const travelRequest = await this.travelRequestsService.getTravelRequest(conversationId);
        if (travelRequest) {
            if (!travelInfo.origin && travelRequest.origin) {
                travelInfo.origin = travelRequest.origin;
            }
            if (!travelInfo.destination && travelRequest.destination) {
                travelInfo.destination = travelRequest.destination;
            }
            if (!travelInfo.departureDate && travelRequest.departureDate) {
                travelInfo.departureDate = travelRequest.departureDate;
            }
            if (!travelInfo.returnDate && travelRequest.returnDate) {
                travelInfo.returnDate = travelRequest.returnDate;
            }
            if (!travelInfo.budget && travelRequest.budget) {
                travelInfo.budget = travelRequest.budget;
            }
        }
        if (Object.keys(travelInfo).length > 0) {
            await this.travelRequestsService.updateTravelRequest(conversationId, travelInfo);
        }
    }
    extractTravelInfo(message) {
        const travelInfo = {};
        const originMatch = message.match(/از (.*?) برم|شهر مبدأ (.*?)$/i);
        if (originMatch) {
            const origin = originMatch[1] || originMatch[2];
            if (cities_1.CITIES.includes(origin)) {
                travelInfo.origin = origin;
            }
        }
        const destinationMatch = message.match(/به (.*?) برم|شهر مقصد (.*?)$/i);
        if (destinationMatch) {
            const destination = destinationMatch[1] || destinationMatch[2];
            if (cities_1.CITIES.includes(destination)) {
                travelInfo.destination = destination;
            }
        }
        const departureDateMatch = message.match(/تاریخ حرکت (.*?)$|در (.*?) برم/i);
        if (departureDateMatch) {
            const dateString = departureDateMatch[1] || departureDateMatch[2];
            travelInfo.departureDate = (0, date_utils_1.parseDate)(dateString);
        }
        const returnDateMatch = message.match(/تاریخ برگشت (.*?)$/i);
        if (returnDateMatch) {
            travelInfo.returnDate = (0, date_utils_1.parseDate)(returnDateMatch[1]);
        }
        const departureDateMatchFromP = message.match(/تاریخ حرکت (.*?)$|در (.*?) برم/i);
        if (departureDateMatch) {
            const dateString = departureDateMatch[1] || departureDateMatch[2];
            travelInfo.departureDate = this.parseDate(dateString);
        }
        const budgetMatch = message.match(/بودجه (.*?) تومان|بودجه (.*?) دلار/i);
        if (budgetMatch) {
            const budgetString = budgetMatch[1] || budgetMatch[2];
            travelInfo.budget = (0, budget_utils_1.parseBudget)(budgetString);
        }
        return travelInfo;
    }
    parseDate(dateString) {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? undefined : date;
    }
};
exports.ChatbotService = ChatbotService;
exports.ChatbotService = ChatbotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [openai_service_1.OpenAIService,
        state_manager_1.StateManager,
        ai_service_1.AIService,
        chats_service_1.ChatsService,
        travel_requests_service_1.TravelRequestsService,
        scraper_client_service_1.ScraperClientService])
], ChatbotService);
function InjectQueue(arg0) {
    throw new Error('Function not implemented.');
}
//# sourceMappingURL=chatbot.service.js.map