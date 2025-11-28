import { Schema, Document } from 'mongoose';
export declare const LearningDataSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    timestamp: NativeDate;
    input: string;
    output: string;
}, Document<unknown, {}, import("mongoose").FlatRecord<{
    timestamp: NativeDate;
    input: string;
    output: string;
}>> & import("mongoose").FlatRecord<{
    timestamp: NativeDate;
    input: string;
    output: string;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export interface LearningData extends Document {
    input: string;
    output: string;
    timestamp: Date;
}
export declare const LEARNINGDATA_MODEL_NAME = "LearningData";
