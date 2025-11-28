import { Schema, Document } from 'mongoose';
export declare const FeedbackSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    userId: string;
    message: string;
    timestamp: NativeDate;
    response: string;
    feedback: "like" | "dislike";
}, Document<unknown, {}, import("mongoose").FlatRecord<{
    userId: string;
    message: string;
    timestamp: NativeDate;
    response: string;
    feedback: "like" | "dislike";
}>> & import("mongoose").FlatRecord<{
    userId: string;
    message: string;
    timestamp: NativeDate;
    response: string;
    feedback: "like" | "dislike";
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export interface Feedback extends Document {
    userId: string;
    message: string;
    response: string;
    feedback: 'like' | 'dislike';
    timestamp: Date;
}
export declare const FEEDBACK_MODEL_NAME = "Feedback";
