import { Model } from 'mongoose';
import { Chat } from '../schema/chat.schema';
export declare class StateManager {
    private chatModel;
    constructor(chatModel: Model<Chat>);
    getState(userId: string): Promise<any>;
    setState(userId: string, state: any): Promise<void>;
}
