import { Model } from 'mongoose';
import { TravelRequest } from '../schema/travel-request.schema';
export declare class TravelRequestsService {
    private travelRequestModel;
    constructor(travelRequestModel: Model<TravelRequest>);
    createTravelRequest(userId: number, conversationId: string): Promise<TravelRequest>;
    updateTravelRequest(conversationId: string, updateData: Partial<TravelRequest>): Promise<TravelRequest>;
    getTravelRequest(conversationId: string): Promise<TravelRequest>;
}
