import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, CHAT_MODEL_NAME } from '../schema/chat.schema';
import { Model } from 'mongoose';
// import { pipeline } from '@transformersjs/transformers';
import { LearningData, LEARNINGDATA_MODEL_NAME } from '../schema/learning-data.schema';
import { OpenAIService } from './openai.service';

@Injectable()
export class AIService {
  private predefinedResponses: { [key: string]: string } = {
    سلام: 'سلام! چطور می‌تونم کمک‌تون کنم؟',
    خداحافظ: 'خداحافظ! سفر خوبی داشته باشید.',
    // سایر پاسخ‌های از پیش تعریف شده
  };
  private model: any;

  constructor(
    @InjectModel(CHAT_MODEL_NAME) private chatModel: Model<Chat>,
    @InjectModel(LEARNINGDATA_MODEL_NAME) private learningDataModel: Model<LearningData>,
    private openaiService: OpenAIService,
  ) {
    this.loadModel();
  }

  async loadModel(): Promise<void> {
    // this.model = await pipeline('text-generation', 'gpt2');
  }

  async getResponse(userId: number, message: string): Promise<object|string> {
    // // دریافت سوابق چت کاربر
    // const chatHistory = await this.chatModel.find({ userId }).exec();
    // const context = chatHistory.map(chat => `${chat.message}\n${chat.response}`).join('\n');

    // // تولید پاسخ با استفاده از مدل NLP
    // const response = await this.model(`${context}\n${message}`, {
    //   max_length: 100,
    //   temperature: 0.7,
    // });

    // // ذخیره چت جدید
    // const newChat = new this.chatModel({ userId, message, response, timestamp: new Date() });
    // await newChat.save();

     // بررسی سوابق چت برای یادگیری
     const similarMessages = await this.learningDataModel
     .find({ input: { $regex: message, $options: 'i' } })
     .exec();

   if (similarMessages.length > 0) {
     // اگر پاسخ مشابهی وجود دارد، از آن استفاده کنید
     return similarMessages[0].output;
   }

   // اگر پاسخ مشابهی وجود ندارد، از OpenAI استفاده کنید
   const response = await this.openaiService.getResponse(message);

   // ذخیره پاسخ OpenAI برای یادگیری آینده
   const learningData = new this.learningDataModel({
     input: message,
     output: response,
   });
   await learningData.save();

    return response;
  }
  getPredefinedResponse(message: string): string | null {
    return this.predefinedResponses[message] || null;
  }
  async trainModel(): Promise<void> {
    // const feedbacks = await this.feedbackModel.find().exec();
    // const trainingData = feedbacks.map(feedback => ({
    //   input: feedback.chatId,
    //   output: feedback.feedback === 'like' ? 1 : 0,
    // }));
  
    // // آموزش مدل با داده‌های جدید
    // await this.model.train(trainingData);
  }
}
