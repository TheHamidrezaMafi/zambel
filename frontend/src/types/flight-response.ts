import Flight from '@/pages/flight/[origin]/[destination]';

export interface FlightResponse {
  siteName: string;
  data: {
    flights: Array<Flight>;
  };
}

export interface Flight {
  adult_price: number | string;
  airline_name_fa: string;
  airline_name_en: string;
  date?: string;
  arrivalTime?: string;
  capacity?: number;
}
export interface FlightData extends Flight {
  arrival_date_time: string;
  departure_date_time: string;
  origin: string;
  destination: string;
  id: string;
  provider_name: string;
  is_foreign_flight: boolean;
  capacity: number;
  flight_number: string;
  original_flight_number?: string;
  base_flight_id?: string;
}
