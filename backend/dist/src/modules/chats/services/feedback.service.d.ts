import { Model } from 'mongoose';
import { Feedback } from '../schema/feedback.schema';
export declare class FeedbackService {
    private feedbackModel;
    constructor(feedbackModel: Model<Feedback>);
    saveFeedback(userId: string, message: string, response: string, feedback: string): Promise<Feedback>;
    getAllFeedbacks(): Promise<Feedback[]>;
}
