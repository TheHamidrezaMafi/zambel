import { Schema, Document } from 'mongoose';

export const LearningDataSchema = new Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export interface LearningData extends Document {
  input: string;
  output: string;
  timestamp: Date;
}

export const LEARNINGDATA_MODEL_NAME = 'LearningData';