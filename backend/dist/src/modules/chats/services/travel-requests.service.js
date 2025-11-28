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
exports.TravelRequestsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const travel_request_schema_1 = require("../schema/travel-request.schema");
let TravelRequestsService = class TravelRequestsService {
    constructor(travelRequestModel) {
        this.travelRequestModel = travelRequestModel;
    }
    async createTravelRequest(userId, conversationId) {
        const travelRequest = new this.travelRequestModel({
            userId,
            conversationId,
        });
        return travelRequest.save();
    }
    async updateTravelRequest(conversationId, updateData) {
        return this.travelRequestModel
            .findOneAndUpdate({ conversationId }, updateData, {
            new: true,
            upsert: true,
        })
            .exec();
    }
    async getTravelRequest(conversationId) {
        return this.travelRequestModel.findOne({ conversationId }).exec();
    }
};
exports.TravelRequestsService = TravelRequestsService;
exports.TravelRequestsService = TravelRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(travel_request_schema_1.TRAVELREQUEST_MODEL_NAME)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TravelRequestsService);
//# sourceMappingURL=travel-requests.service.js.map