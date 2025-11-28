import { Chat } from '../schema/chat.schema';
import { Model } from 'mongoose';
import { LearningData } from '../schema/learning-data.schema';
import { OpenAIService } from './openai.service';
export declare class AIService {
    private chatModel;
    private learningDataModel;
    private openaiService;
    private predefinedResponses;
    private model;
    constructor(chatModel: Model<Chat>, learningDataModel: Model<LearningData>, openaiService: OpenAIService);
    loadModel(): Promise<void>;
    getResponse(userId: number, message: string): Promise<object | string>;
    getPredefinedResponse(message: string): string | null;
    trainModel(): Promise<void>;
}
