import { Schema, Document } from 'mongoose';
export declare const TravelRequestSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    timestamp: NativeDate;
    userId: number;
    conversationId: string;
    origin?: string;
    destination?: string;
    departureDate?: NativeDate;
    returnDate?: NativeDate;
    budget?: number;
}, Document<unknown, {}, import("mongoose").FlatRecord<{
    timestamp: NativeDate;
    userId: number;
    conversationId: string;
    origin?: string;
    destination?: string;
    departureDate?: NativeDate;
    returnDate?: NativeDate;
    budget?: number;
}>> & import("mongoose").FlatRecord<{
    timestamp: NativeDate;
    userId: number;
    conversationId: string;
    origin?: string;
    destination?: string;
    departureDate?: NativeDate;
    returnDate?: NativeDate;
    budget?: number;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
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
export declare const TRAVELREQUEST_MODEL_NAME = "TravelRequest";
