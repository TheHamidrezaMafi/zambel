import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat,CHAT_MODEL_NAME,ChatSchema } from '../schema/chat.schema';

@Injectable()
export class StateManager {
  constructor(@InjectModel(CHAT_MODEL_NAME) private chatModel: Model<Chat>) {}

  async getState(userId: string): Promise<any> {
    const chats = await this.chatModel.find({ userId }).exec();
    return { chats };
  }

  async setState(userId: string, state: any): Promise<void> {
    await this.chatModel.updateOne({ userId }, { $set: state }, { upsert: true });
  }
}