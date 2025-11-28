import { Schema, Document } from 'mongoose';

export const TravelRequestSchema = new Schema({
  userId: { type: Number, required: true }, // آیدی کاربر
  conversationId: { type: String, required: true }, // آیدی مکالمه
  origin: { type: String, required: false }, // شهر مبدأ
  destination: { type: String, required: false }, // شهر مقصد
  departureDate: { type: Date, required: false }, // تاریخ حرکت
  returnDate: { type: Date, required: false }, // تاریخ برگشت
  budget: { type: Number, required: false }, // بودجه سفر
  timestamp: { type: Date, default: Date.now }, // زمان ایجاد درخواست
});

export interface TravelRequest extends Document {
  userId: number;
  conversationId: string;
  origin?: string;
  destination?: string;
  departureDate?: Date;
  returnDate?: Date;
  budget?: number;
  timestamp: Date;
}
export const TRAVELREQUEST_MODEL_NAME = 'TravelRequest';
