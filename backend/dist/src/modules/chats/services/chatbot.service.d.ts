import { OpenAIService } from './openai.service';
import { StateManager } from '../managers/state-manager';
import { AIService } from './ai.service';
import { ChatsService } from './chats.service';
import { TravelRequestsService } from './travel-requests.service';
import { TravelRequest } from '../schema/travel-request.schema';
import { ScraperClientService } from './scraper-client.service';
export declare class ChatbotService {
    private openaiService;
    private stateManager;
    private aiService;
    private chatsService;
    private travelRequestsService;
    private scraperClientService;
    constructor(openaiService: OpenAIService, stateManager: StateManager, aiService: AIService, chatsService: ChatsService, travelRequestsService: TravelRequestsService, scraperClientService: ScraperClientService);
    handleMessage({ userId, message, ...body }: {
        [x: string]: any;
        userId: any;
        message: any;
    }): Promise<object>;
    getChatResponse(message: string, userId: undefined): Promise<object>;
    private isHotelOrFlightRequest;
    private sendToScraper;
    searchHotels(queryObject: Object): Promise<any>;
    searchFlights(origin: string, destination: string, date: string, return_date?: any): Promise<any>;
    private extractDestination;
    isTravelInfo(message: string): boolean;
    private isTravelInfoComplete;
    private updateTravelRequest;
    extractTravelInfo(message: string): Partial<TravelRequest>;
    private parseDate;
}
