"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentimentAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const transformers_1 = require("transformers");
let SentimentAnalysisService = class SentimentAnalysisService {
    async loadModel() {
        this.sentimentPipeline = await (0, transformers_1.pipeline)('sentiment-analysis');
    }
    async analyzeSentiment(text) {
        const result = await this.sentimentPipeline(text);
        return result[0].label;
    }
};
exports.SentimentAnalysisService = SentimentAnalysisService;
exports.SentimentAnalysisService = SentimentAnalysisService = __decorate([
    (0, common_1.Injectable)()
], SentimentAnalysisService);
//# sourceMappingURL=sentiment-analysis.service.js.map