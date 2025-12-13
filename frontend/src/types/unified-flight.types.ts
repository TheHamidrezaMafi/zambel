// Types for the new unified flight API with base_flight_id grouping

export interface UnifiedAirline {
  code: string;
  name_fa: string;
  name_en: string;
  logo_url?: string;
}

export interface UnifiedRoute {
  origin: string;
  destination: string;
  origin_city_fa: string | null;
  destination_city_fa: string | null;
  origin_terminal: string | null;
  destination_terminal: string | null;
}

export interface UnifiedSchedule {
  departure_datetime: string;
  arrival_datetime: string;
  duration_minutes: number;
  stops: number;
}

export interface PricingOption {
  flight_id: string;
  provider: string;
  price: number;
  cabin_class: string;
  cabin_class_fa: string;
  capacity: number;
  is_refundable: boolean;
  is_charter: boolean;
  cabin: string;
  ticket_type: string;
  baggage_kg: number | null;
  booking_class: string | null;
  original_id: string;
}

export interface GroupedFlight {
  base_flight_id: string;
  flight_number: string;
  airline: UnifiedAirline;
  route: UnifiedRoute;
  schedule: UnifiedSchedule;
  lowestPrice: number;
  highestPrice: number;
  availableProviders: number;
  pricingOptions: PricingOption[];
}

export interface SearchMetadata {
  total_flights: number;
  total_options: number;
  providers_queried: string[];
  providers_successful: string[];
  providers_failed: string[];
  search_time_ms: number;
  cached: boolean;
}

export interface UnifiedSearchResponse {
  flights: GroupedFlight[];
  metadata: SearchMetadata;
}
