import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ScraperClientService implements OnModuleInit {
    private eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    onModuleInit(): void;
    searchHotels(queryObject: any): Promise<any>;
    searchFlights(origin: string, destination: string, departureDate: string, return_date: string, others: any): Promise<any>;
}
