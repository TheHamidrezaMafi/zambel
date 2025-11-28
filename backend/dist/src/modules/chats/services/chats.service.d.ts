import { Model } from 'mongoose';
import { Chat } from '../schema/chat.schema';
export declare class ChatsService {
    private chatModel;
    constructor(chatModel: Model<Chat>);
    saveMessage(userId: number, conversationId: string, message: string | Object, sender: 'user' | 'bot', topic?: string): Promise<Chat>;
    getChatsByUserId(userId: string): Promise<Chat[]>;
    getConversationsByUserId(userId: number): Promise<string[]>;
    getMessagesByConversationId(conversationId: string): Promise<Chat[]>;
    getConversationMessages(conversationId: string): Promise<Chat[]>;
}
