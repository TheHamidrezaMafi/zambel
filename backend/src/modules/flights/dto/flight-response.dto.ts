import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AirlineDto {
  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  name_en?: string;

  @ApiPropertyOptional()
  name_fa?: string;

  @ApiPropertyOptional()
  logo_url?: string;
}

export class AirportDto {
  @ApiProperty()
  airport_code: string;

  @ApiPropertyOptional()
  airport_name_en?: string;

  @ApiPropertyOptional()
  airport_name_fa?: string;

  @ApiPropertyOptional()
  city_code?: string;

  @ApiPropertyOptional()
  city_name_en?: string;

  @ApiPropertyOptional()
  city_name_fa?: string;

  @ApiPropertyOptional()
  terminal?: string;
}

export class RouteDto {
  @ApiProperty()
  origin: AirportDto;

  @ApiProperty()
  destination: AirportDto;
}

export class ScheduleDto {
  @ApiProperty()
  departure_datetime: string;

  @ApiProperty()
  arrival_datetime: string;

  @ApiPropertyOptional()
  departure_date_jalali?: string;

  @ApiPropertyOptional()
  arrival_date_jalali?: string;

  @ApiPropertyOptional()
  duration_minutes?: number;

  @ApiPropertyOptional()
  stops?: number;
}

export class PassengerPricingDto {
  @ApiProperty()
  base_fare: number;

  @ApiProperty()
  total_fare: number;

  @ApiPropertyOptional()
  taxes?: number;

  @ApiPropertyOptional()
  service_charge?: number;

  @ApiPropertyOptional()
  commission?: number;
}

export class PricingDto {
  @ApiProperty()
  adult: PassengerPricingDto;

  @ApiPropertyOptional()
  child?: PassengerPricingDto;

  @ApiPropertyOptional()
  infant?: PassengerPricingDto;

  @ApiProperty()
  currency: string;
}

export class CabinDto {
  @ApiProperty()
  class: string;

  @ApiPropertyOptional()
  class_display_name_fa?: string;

  @ApiPropertyOptional()
  booking_class?: string;
}

export class TicketInfoDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  is_charter: boolean;

  @ApiProperty()
  is_refundable: boolean;

  @ApiProperty()
  is_domestic: boolean;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  reservable: boolean;

  @ApiPropertyOptional()
  requires_passport?: boolean;
}

export class FlightResponseDto {
  @ApiProperty()
  base_flight_id: string;

  @ApiProperty()
  flight_id: string;

  @ApiProperty()
  provider_source: string;

  @ApiProperty()
  original_id: string;

  @ApiProperty()
  flight_number: string;

  @ApiProperty()
  airline: AirlineDto;

  @ApiPropertyOptional()
  operating_airline?: AirlineDto;

  @ApiPropertyOptional()
  aircraft?: {
    type?: string;
    code?: string;
  };

  @ApiProperty()
  route: RouteDto;

  @ApiProperty()
  schedule: ScheduleDto;

  @ApiProperty()
  pricing: PricingDto;

  @ApiPropertyOptional()
  cabin?: CabinDto;

  @ApiProperty()
  ticket_info: TicketInfoDto;

  @ApiPropertyOptional()
  policies?: any;

  @ApiPropertyOptional()
  metadata?: any;
}

export class PriceHistoryPointDto {
  @ApiProperty()
  scraped_at: string;

  @ApiProperty()
  provider_source: string;

  @ApiProperty()
  adult_total_fare: number;

  @ApiPropertyOptional()
  child_total_fare?: number;

  @ApiPropertyOptional()
  infant_total_fare?: number;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  is_available: boolean;

  @ApiProperty()
  age_minutes: number;
}

export class PriceChangeDto {
  @ApiProperty()
  scraped_at: string;

  @ApiProperty()
  provider_source: string;

  @ApiProperty()
  adult_total_fare: number;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  price_change: number;

  @ApiProperty()
  price_change_percent: number;

  @ApiProperty()
  capacity_change: number;
}

export class DailyStatsDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  min_price: number;

  @ApiProperty()
  max_price: number;

  @ApiProperty()
  avg_price: number;

  @ApiProperty()
  price_volatility: number;

  @ApiProperty()
  min_capacity: number;

  @ApiProperty()
  max_capacity: number;

  @ApiProperty()
  scrape_count: number;

  @ApiProperty()
  cheapest_provider: string;
}

export class ProviderComparisonDto {
  @ApiProperty()
  provider_source: string;

  @ApiProperty()
  adult_total_fare: number;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  age_minutes: number;

  @ApiProperty()
  is_available: boolean;
}

export class CapacityTrendDto {
  @ApiProperty()
  scraped_at: string;

  @ApiProperty()
  provider_source: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  capacity_change: number;

  @ApiProperty()
  hours_until_departure: number;

  @ApiProperty()
  booking_velocity: number;
}

export class PriceDropDto {
  @ApiProperty()
  base_flight_id: string;

  @ApiProperty()
  flight_number: string;

  @ApiProperty()
  airline_code: string;

  @ApiProperty()
  origin: string;

  @ApiProperty()
  destination: string;

  @ApiProperty()
  departure_datetime: string;

  @ApiProperty()
  current_price: number;

  @ApiProperty()
  previous_price: number;

  @ApiProperty()
  price_drop: number;

  @ApiProperty()
  drop_percentage: number;

  @ApiProperty()
  provider_source: string;

  @ApiProperty()
  hours_ago: number;
}

export class ScrapingStatsDto {
  @ApiProperty()
  provider: string;

  @ApiProperty()
  scrape_count: number;

  @ApiProperty()
  flights_found: number;

  @ApiProperty()
  avg_flights_per_scrape: number;

  @ApiProperty()
  first_scrape: string;

  @ApiProperty()
  last_scrape: string;

  @ApiProperty()
  scrape_frequency_minutes: number;
}

export class FlightSearchResponseDto {
  @ApiProperty({ type: [FlightResponseDto] })
  flights: FlightResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  source: 'database' | 'scraper' | 'mixed';

  @ApiProperty()
  cached: boolean;

  @ApiPropertyOptional()
  cache_age_minutes?: number;
}
