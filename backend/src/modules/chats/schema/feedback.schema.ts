import { Schema, Document } from 'mongoose';

export const FeedbackSchema = new Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  feedback: { type: String, enum: ['like', 'dislike'], required: true },
  timestamp: { type: Date, default: Date.now },
});

export interface Feedback extends Document {
  userId: string;
  message: string;
  response: string;
  feedback: 'like' | 'dislike';
  timestamp: Date;
}

export const FEEDBACK_MODEL_NAME = 'Feedback'; // تعریف نام مدل به صورت دستی
