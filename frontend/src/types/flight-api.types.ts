// TypeScript types matching backend DTOs for new database-backed API endpoints

// ==================== Request Types ====================

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabin_class?: 'economy' | 'business' | 'first';
}

export interface PriceHistoryQuery {
  hours_back?: number; // Default: 168 (7 days)
}

export interface PriceDropQuery {
  origin: string;
  destination: string;
  departure_dates: string[];
  drop_threshold_percent?: number; // Default: 10
}

export interface ScrapingStatsQuery {
  hours_back?: number; // Default: 24
}

// ==================== Response Types ====================

// Airlines
export interface AirlineDto {
  airline_code: string;
  airline_name_fa?: string;
  airline_name_en?: string;
  logo_url?: string;
  website?: string;
  is_charter: boolean;
}

// Airports
export interface AirportDto {
  airport_code: string;
  airport_name_fa?: string;
  airport_name_en?: string;
  city_name_fa?: string;
  city_name_en?: string;
  country_code?: string;
  timezone?: string;
}

// Route
export interface RouteDto {
  origin: AirportDto;
  destination: AirportDto;
}

// Schedule
export interface ScheduleDto {
  departure_datetime: string;
  arrival_datetime: string;
  duration_minutes: number;
  departure_terminal?: string;
  arrival_terminal?: string;
}

// Pricing
export interface PassengerPricingDto {
  base_fare: number;
  tax: number;
  service_charge: number;
  total_fare: number;
}

export interface PricingDto {
  adult: PassengerPricingDto;
  child?: PassengerPricingDto;
  infant?: PassengerPricingDto;
}

// Cabin
export interface CabinDto {
  cabin_class: 'economy' | 'business' | 'first';
  cabin_class_fa?: string;
  baggage_allowance?: string;
  max_allowed_baggage?: number;
  baggage_unit?: string;
}

// Ticket Info
export interface TicketInfoDto {
  is_refundable: boolean;
  is_exchangeable: boolean;
  is_charter: boolean;
  allowed_baggage?: number;
  allowed_baggage_unit?: string;
  refund_rules?: string;
  penalties?: string;
}

// Main Flight Response
export interface FlightDto {
  base_flight_id: string;
  flight_number: string;
  airline: AirlineDto;
  route: RouteDto;
  schedule: ScheduleDto;
  pricing: PricingDto;
  cabin: CabinDto;
  ticket_info: TicketInfoDto;
  aircraft_type?: string;
  capacity: number;
  available_seats?: number;
  provider_source: string;
  reservation_link?: string;
  last_updated: string;
}

// Enhanced Search Response
export interface FlightSearchResponse {
  flights: FlightDto[];
  source: 'database' | 'scraper' | 'mixed';
  cached: boolean;
  cache_age_minutes?: number;
  response_time_ms?: number;
}

// ==================== Price History Types ====================

export interface PriceHistoryPoint {
  scraped_at: string;
  provider_source: string;
  adult_total_fare: number;
  capacity: number;
  available_seats?: number;
  age_minutes: number;
}

export interface PriceHistoryInsights {
  overall_min: number;
  overall_max: number;
  overall_avg: number;
  current_price: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: 'high' | 'moderate' | 'low';
  recommendation: string;
}

export interface PriceHistoryResponse {
  base_flight_id: string;
  flight_number: string;
  history: PriceHistoryPoint[];
  insights?: PriceHistoryInsights;
}

// ==================== Price Changes Types ====================

export interface PriceChange {
  changed_at: string;
  provider_source: string;
  old_price: number;
  new_price: number;
  change_amount: number;
  change_percent: number;
  hours_since_last_change: number;
}

export interface PriceChangesResponse {
  base_flight_id: string;
  flight_number: string;
  changes: PriceChange[];
}

// ==================== Daily Stats Types ====================

export interface DailyStats {
  stat_date: string;
  scrape_count: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  price_volatility: number;
  providers_count: number;
}

export interface DailyStatsInsights {
  overall_min: number;
  overall_max: number;
  overall_avg: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

export interface DailyStatsResponse {
  base_flight_id: string;
  flight_number: string;
  daily_stats: DailyStats[];
  insights?: DailyStatsInsights;
}

// ==================== Provider Comparison Types ====================

export interface ProviderComparison {
  provider_source: string;
  adult_total_fare: number;
  capacity: number;
  available_seats?: number;
  age_minutes: number;
}

export interface BestDeal {
  provider_source: string;
  adult_total_fare: number;
}

export interface PriceComparisonResponse {
  base_flight_id: string;
  flight_number: string;
  providers: ProviderComparison[];
  best_deal?: BestDeal;
  price_difference?: number;
  comparison_time: string;
}

// ==================== Capacity Trend Types ====================

export interface CapacityTrendPoint {
  checked_at: string;
  provider_source: string;
  capacity: number;
  available_seats?: number;
  adult_total_fare: number;
  hours_ago: number;
}

export interface CapacityTrendInsights {
  initial_capacity: number;
  current_capacity: number;
  capacity_change: number;
  booking_rate_per_hour: number;
  urgency: 'critical' | 'high' | 'moderate' | 'low';
  estimated_hours_until_full?: number;
}

export interface CapacityTrendResponse {
  base_flight_id: string;
  flight_number: string;
  trend: CapacityTrendPoint[];
  insights?: CapacityTrendInsights;
}

// ==================== Price Drops Types ====================

export interface PriceDrop {
  base_flight_id: string;
  flight_number: string;
  airline_code: string;
  airline_name_fa?: string;
  departure_datetime: string;
  previous_price: number;
  current_price: number;
  drop_amount: number;
  drop_percent: number;
  provider_source: string;
  hours_since_drop: number;
}

export interface PriceDropsResponse {
  drops: PriceDrop[];
  total_count: number;
}

// ==================== Scraping Stats Types ====================

export interface ScrapingStatsPerProvider {
  provider_source: string;
  scrape_count: number;
  flight_count: number;
  success_rate: number;
  avg_flights_per_scrape: number;
  last_scrape_at: string;
}

export interface ScrapingStatsResponse {
  period_hours: number;
  total_scrapes: number;
  total_flights: number;
  providers: ScrapingStatsPerProvider[];
}

// ==================== Flight Details Types ====================

export interface FlightDetailsResponse {
  base_flight: FlightDto;
  latest_snapshot?: FlightDto;
  price_comparison?: PriceComparisonResponse;
  daily_stats?: DailyStatsResponse;
  capacity_trend?: CapacityTrendResponse;
}
