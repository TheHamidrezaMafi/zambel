import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TravelRequest,
  TRAVELREQUEST_MODEL_NAME,
} from '../schema/travel-request.schema';

@Injectable()
export class TravelRequestsService {
  constructor(
    @InjectModel(TRAVELREQUEST_MODEL_NAME)
    private travelRequestModel: Model<TravelRequest>,
  ) {}

  async createTravelRequest(
    userId: number,
    conversationId: string,
  ): Promise<TravelRequest> {
    const travelRequest = new this.travelRequestModel({
      userId,
      conversationId,
    });
    return travelRequest.save();
  }

  async updateTravelRequest(
    conversationId: string,
    updateData: Partial<TravelRequest>,
  ): Promise<TravelRequest> {
    return this.travelRequestModel
      .findOneAndUpdate({ conversationId }, updateData, {
        new: true,
        upsert: true,
      })
      .exec();
  }
  async getTravelRequest(conversationId: string): Promise<TravelRequest> {
    return this.travelRequestModel.findOne({ conversationId }).exec();
  }
}
