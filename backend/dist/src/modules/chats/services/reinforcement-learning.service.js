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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReinforcementLearningService = void 0;
const common_1 = require("@nestjs/common");
const feedback_service_1 = require("./feedback.service");
const natural_1 = require("natural");
let ReinforcementLearningService = class ReinforcementLearningService {
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
        this.tfidf = new natural_1.TfIdf();
    }
    async trainModel() {
        const feedbacks = await this.feedbackService.getAllFeedbacks();
        const inputs = feedbacks.map((feedback) => this.encodeMessage(feedback.message));
        const labels = feedbacks.map((feedback) => feedback.feedback == 'like' ? 1 : 0);
    }
    encodeMessage(message) {
        const words = message.split(' ');
        const vector = [];
        words.forEach((word) => {
            this.tfidf.addDocument(word);
        });
        this.tfidf.listTerms(0).forEach((term) => {
            vector.push(term.tfidf);
        });
        return vector;
    }
    async predictFeedback(message) {
    }
};
exports.ReinforcementLearningService = ReinforcementLearningService;
exports.ReinforcementLearningService = ReinforcementLearningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], ReinforcementLearningService);
//# sourceMappingURL=reinforcement-learning.service.js.map