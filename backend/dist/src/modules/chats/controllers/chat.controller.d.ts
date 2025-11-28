import { ChatsService } from '../services/chats.service';
import { ChatbotService } from '../services/chatbot.service';
import { CreateChatDto } from '../dto/chat.dto';
export declare class ChatController {
    private chatsService;
    private chatbotService;
    constructor(chatsService: ChatsService, chatbotService: ChatbotService);
    handleMessage(body: CreateChatDto): Promise<object>;
    getChatsByUserId(userId: number): Promise<import("../schema/chat.schema").Chat[]>;
}
