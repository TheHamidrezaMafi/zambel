import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ChatsService } from '../services/chats.service';
import { ChatbotService } from '../services/chatbot.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateChatDto } from '../dto/chat.dto';

@ApiTags('chatbot')
@Controller('chat')
export class ChatController {
  constructor(
    private chatsService: ChatsService,
    private chatbotService: ChatbotService,
  ) {}

  // @Post()
  // async handleMessage(@Body() body) {
  //   const { message, userId, ...others } = body;
  //   await this.chatsService.saveMessage(userId, message);
  //   const response = await this.chatbotService.getChatResponse(message, userId);
  //   return { response };
  // }
  @Post()
  @ApiOperation({ summary: 'Send a message to the chatbot' })

  @ApiResponse({ status: 200, description: 'The response from the chatbot' })
  async handleMessage(@Body() body:CreateChatDto) {
    return this.chatbotService.handleMessage(body);
  }

  @Get(':userId')
  async getChatsByUserId(@Param('userId') userId: number) {
    return this.chatsService.getChatsByUserId(''+userId);
  }
} 


