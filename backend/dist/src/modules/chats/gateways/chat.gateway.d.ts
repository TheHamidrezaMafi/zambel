import { Server, Socket } from 'socket.io';
import { ChatbotService } from '../services/chatbot.service';
export declare class ChatGateway {
    private chatbotService;
    server: Server;
    constructor(chatbotService: ChatbotService);
    handleMessage(data: {
        userId: string;
        message: string;
    }, client: Socket): Promise<void>;
}
