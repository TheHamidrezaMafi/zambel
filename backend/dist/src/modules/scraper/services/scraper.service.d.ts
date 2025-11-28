import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { FlightProcessedByUserReqeust, GetRequestedFlightsByUserResponse } from '../interfaces/scraper.interface';
export declare class ScraperService implements OnModuleInit {
    private client;
    private scraperService;
    constructor(client: ClientGrpc);
    onModuleInit(): void;
    private normalizeAirlineName;
    private normalizeFlightNumber;
    private normalizeFlightData;
    private sortFlightsByDepartureTime;
    takeRequests(data: GetRequestedFlightsByUserResponse): Promise<FlightProcessedByUserReqeust>;
}
