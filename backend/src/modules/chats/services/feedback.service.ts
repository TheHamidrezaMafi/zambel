import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Feedback,
  FEEDBACK_MODEL_NAME,
  FeedbackSchema,
} from '../schema/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(FEEDBACK_MODEL_NAME) private feedbackModel: Model<Feedback>,
  ) {}

  async saveFeedback(
    userId: string,
    message: string,
    response: string,
    feedback: string,
  ): Promise<Feedback> {
    const feedbackEntry = new this.feedbackModel({
      userId,
      message,
      response,
      feedback,
    });
    return feedbackEntry.save();
  }

  async getAllFeedbacks(): Promise<Feedback[]> {
    return this.feedbackModel.find().exec();
  }
}
