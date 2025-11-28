import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, CHAT_MODEL_NAME, ChatSchema } from './schema/chat.schema';
import { ChatsService } from './services/chats.service';
import { ChatController } from './controllers/chat.controller';
import { ChatbotService } from './services/chatbot.service';
import { OpenAIService } from './services/openai.service';
import { StateManager } from './managers/state-manager';
import { TravelRequestsService } from './services/travel-requests.service';
import {
  TRAVELREQUEST_MODEL_NAME,
  TravelRequestSchema,
} from './schema/travel-request.schema';
import { AIService } from './services/ai.service';
import { ChatGateway } from './gateways/chat.gateway';
import { ScraperClientService } from './services/scraper-client.service';
import {
  LEARNINGDATA_MODEL_NAME,
  LearningDataSchema,
} from './schema/learning-data.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CHAT_MODEL_NAME, schema: ChatSchema }]),
    MongooseModule.forFeature([
      { name: TRAVELREQUEST_MODEL_NAME, schema: TravelRequestSchema },
    ]),
    MongooseModule.forFeature([
      { name: LEARNINGDATA_MODEL_NAME, schema: LearningDataSchema },
    ]),
    ConfigModule,
  ],
  providers: [
    ChatsService,
    ChatbotService,
    StateManager,
    TravelRequestsService,
    AIService,
    OpenAIService,
    ChatGateway,
    ScraperClientService,
  ],
  controllers: [ChatController],
  exports: [ChatbotService, ChatsService, ScraperClientService],
})
export class ChatsModule {}
