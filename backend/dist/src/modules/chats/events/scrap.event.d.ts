export declare class FlightScrapEvent {
    origin: string;
    destination: string;
    adult: number;
    child: number;
    infant?: Boolean;
    departureDate?: Date;
}
export declare class HotelScrapEvent {
    checkinDate?: Date;
    checkoutDate?: Date;
    adult: number;
    child: number;
    destination?: string;
}
