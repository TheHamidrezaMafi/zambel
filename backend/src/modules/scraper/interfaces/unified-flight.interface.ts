/**
 * Unified flight data format interfaces
 * These match the Python scraper's unified API response format
 */

export interface UnifiedAirline {
  code: string;
  name_fa: string;
  name_en: string;
  logo_url?: string;
}

export interface UnifiedAirport {
  airport_code: string;
  airport_name_en?: string;
  airport_name_fa?: string;
  city_code: string;
  city_name_en?: string;
  city_name_fa: string;
  terminal?: string;
}

export interface UnifiedRoute {
  origin: UnifiedAirport;
  destination: UnifiedAirport;
}

export interface UnifiedSchedule {
  departure_datetime: string; // ISO 8601
  arrival_datetime: string;   // ISO 8601
  departure_date_jalali?: string;
  arrival_date_jalali?: string;
  duration_minutes: number;
  stops: number;
  connection_time_minutes?: number;
}

export interface UnifiedPriceDetail {
  base_fare: number;
  total_fare: number;
  taxes?: number;
  service_charge?: number;
  commission?: number;
}

export interface UnifiedPricing {
  adult: UnifiedPriceDetail;
  child?: UnifiedPriceDetail;
  infant?: UnifiedPriceDetail;
  currency: string; // "IRR"
}

export interface UnifiedCabin {
  class: 'economy' | 'business' | 'first' | 'premium_economy';
  class_display_name_fa: string;
  booking_class?: string;
}

export interface UnifiedTicketInfo {
  type: 'charter' | 'system' | 'tour';
  is_charter: boolean;
  is_refundable: boolean;
  is_domestic: boolean;
  capacity: number;
  reservable: boolean;
  requires_passport?: boolean;
}

export interface UnifiedBaggage {
  checked?: {
    adult_kg?: number;
    child_kg?: number;
    infant_kg?: number;
    pieces?: number;
  };
  cabin?: {
    kg?: number;
    pieces?: number;
  };
}

export interface UnifiedCancellationRule {
  time_period: string;
  refund_percentage: number;
  penalty_percentage: number;
}

export interface UnifiedPolicies {
  cancellation_rules?: UnifiedCancellationRule[];
  fare_rules?: string;
  terms?: string;
}

export interface UnifiedAdditionalInfo {
  promoted: boolean;
  discount_percent?: number;
  special_offers?: string[];
  tags?: string[];
  rating?: number;
}

export interface UnifiedProvider {
  provider_id: string;
  provider_name: string;
  price: number;
  capacity: number;
  booking_url: string;
}

export interface UnifiedMetadata {
  scraped_at: string; // ISO timestamp
  original_id: string;
  proposal_id?: string;
  search_id?: string;
}

export interface UnifiedAircraft {
  type?: string; // e.g., "Boeing 737"
  code?: string; // e.g., "B737"
}

export interface UnifiedOperatingAirline {
  code?: string;
  name_en?: string;
  name_fa?: string;
}

/**
 * Complete unified flight object
 */
export interface UnifiedFlight {
  // Flight Identification
  base_flight_id: string;  // For grouping same physical flight
  flight_id: string;        // Unique per pricing option
  provider_source: string;  // Original scraper name
  
  // Flight Basic Info
  flight_number: string;
  airline: UnifiedAirline;
  operating_airline?: UnifiedOperatingAirline;
  aircraft?: UnifiedAircraft;
  
  // Route Information
  route: UnifiedRoute;
  
  // Schedule
  schedule: UnifiedSchedule;
  
  // Pricing
  pricing: UnifiedPricing;
  
  // Cabin & Class
  cabin: UnifiedCabin;
  
  // Ticket Type & Availability
  ticket_info: UnifiedTicketInfo;
  
  // Baggage Allowance
  baggage?: UnifiedBaggage;
  
  // Policies
  policies?: UnifiedPolicies;
  
  // Additional Information
  additional_info?: UnifiedAdditionalInfo;
  
  // Multi-Provider Data
  providers?: UnifiedProvider[];
  
  // Metadata
  metadata: UnifiedMetadata;
}

/**
 * Scraper API request format
 */
export interface ScraperUnifiedRequest {
  provider_name: string;
  requests: {
    from_destination: string;
    to_destination: string;
    from_date: string;
    to_date?: string;
    is_foreign_flight: boolean;
    requested_by_user_id: string;
    type: string;
  }[];
}

/**
 * Scraper API response format
 */
export interface ScraperUnifiedResponse {
  flights: UnifiedFlight[];
  total: number;
  provider: string;
  format: string;
  scrape_time_seconds: number;
}
