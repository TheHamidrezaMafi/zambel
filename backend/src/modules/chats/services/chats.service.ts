import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, CHAT_MODEL_NAME } from '../schema/chat.schema';

@Injectable()
export class ChatsService {
  constructor(@InjectModel(CHAT_MODEL_NAME) private chatModel: Model<Chat>) {}

  async saveMessage(
    userId: number,
    conversationId: string,
    message: string|Object,
    sender: 'user' | 'bot',
    topic?: string,
  ): Promise<Chat> {
    const chat = new this.chatModel({
      userId,
      conversationId,
      message,
      sender,
      topic,
    });
    return chat.save();
  }

  async getChatsByUserId(userId: string): Promise<Chat[]> {
    return this.chatModel.find({ userId }).exec();
  }
  async getConversationsByUserId(userId: number): Promise<string[]> {
    const conversations = await this.chatModel
      .find({ userId })
      .distinct('conversationId')
      .exec();
    return conversations;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Chat[]> {
    return this.chatModel.find({ conversationId }).exec();
  }
  async getConversationMessages(conversationId: string): Promise<Chat[]> {
    return this.chatModel.find({ conversationId }).exec();
  }
}
