import { Observable } from 'rxjs';
export interface FlightRequestedByUserItem {
    requested_by_user_id: string;
    type: string;
    from_destination: string;
    from_date: string;
    to_destination: string;
    to_date: string;
    is_foreign_flight: boolean;
}
export interface GetRequestedFlightsByUserResponse {
    provider_name: string;
    requests: FlightRequestedByUserItem[];
}
export interface FlightProcessed {
    provider_name: string;
    origin: string;
    destination: string;
    departure_date_time: string;
    arrival_date_time: string;
    adult_price: number;
    airline_name_fa: string;
    airline_name_en: string;
    flight_number: string;
    original_flight_number?: string;
    capacity: number;
    rules: string;
    is_foreign_flight: boolean;
}
export interface FlightProcessedByUserReqeust {
    flights: FlightProcessed[];
}
export interface ScraperGrpcService {
    TakeRequests(data: GetRequestedFlightsByUserResponse): Observable<FlightProcessedByUserReqeust>;
}
