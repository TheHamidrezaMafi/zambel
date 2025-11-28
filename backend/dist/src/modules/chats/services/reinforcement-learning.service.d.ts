import { FeedbackService } from './feedback.service';
export declare class ReinforcementLearningService {
    private feedbackService;
    private tfidf;
    constructor(feedbackService: FeedbackService);
    trainModel(): Promise<void>;
    private encodeMessage;
    predictFeedback(message: string): Promise<void>;
}
