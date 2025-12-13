import { Schema, Document } from 'mongoose';
export declare const ChatSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    timestamp: NativeDate;
    userId: number;
    conversationId: string;
    message: string;
    sender: "user" | "bot";
    topic?: string;
}, Document<unknown, {}, import("mongoose").FlatRecord<{
    timestamp: NativeDate;
    userId: number;
    conversationId: string;
    message: string;
    sender: "user" | "bot";
    topic?: string;
}>> & import("mongoose").FlatRecord<{
    timestamp: NativeDate;
    userId: number;
    conversationId: string;
    message: string;
    sender: "user" | "bot";
    topic?: string;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export interface Chat extends Document {
    userId: number;
    conversationId: string;
    message: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    topic?: string;
}
export declare const CHAT_MODEL_NAME = "Chat";
