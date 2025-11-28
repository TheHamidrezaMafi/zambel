import { Schema, Document } from 'mongoose';

export const ChatSchema = new Schema({
  userId: { type: Number, required: true }, // آیدی کاربر از PostgreSQL
  conversationId: { type: String, required: true }, // آیدی مکالمه
  message: { type: String, required: true }, // متن پیام
  sender: { type: String, enum: ['user', 'bot'], required: true }, // ارسال‌کننده پیام
  timestamp: { type: Date, default: Date.now }, // زمان ارسال پیام
  topic: { type: String, required: false }, // موضوع مکالمه (اختیاری)
});

export interface Chat extends Document {
  userId: number; // آیدی کاربر
  conversationId: string; // آیدی مکالمه
  message: string; // متن پیام
  sender: 'user' | 'bot'; // ارسال‌کننده پیام
  timestamp: Date; // زمان ارسال پیام
  topic?: string; // موضوع مکالمه (اختیاری)
}

export const CHAT_MODEL_NAME = 'Chat';
