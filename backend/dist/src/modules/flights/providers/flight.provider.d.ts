import { Flights } from "../models/flight.entity";
export declare const flightProviders: {
    provide: string;
    useValue: typeof Flights;
}[];
