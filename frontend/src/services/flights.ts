import {
  FlightSearchParams,
  FlightSearchResponse,
  PriceHistoryQuery,
  PriceHistoryResponse,
  PriceChangesResponse,
  DailyStatsResponse,
  PriceComparisonResponse,
  CapacityTrendResponse,
  PriceDropQuery,
  PriceDropsResponse,
  ScrapingStatsQuery,
  ScrapingStatsResponse,
  FlightDetailsResponse,
} from '@/types/flight-api.types';
import { UnifiedSearchResponse } from '@/types/unified-flight.types';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// ==================== New Unified API (with base_flight_id grouping) ====================

/**
 * Fetch flights using the new unified API with intelligent grouping
 * Returns flights grouped by base_flight_id with multiple pricing options
 */
export const fetchFlightsUnified = async (params: {
  origin: string;
  destination: string;
  start_date: string;
  return_date?: string;
  adult: number;
}): Promise<UnifiedSearchResponse> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/flights/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: UnifiedSearchResponse = await response.json();
    return result;
  } catch (err: any) {
    console.error('Fetch error:', err);
    return {
      flights: [],
      metadata: {
        total_flights: 0,
        total_options: 0,
        providers_queried: [],
        providers_successful: [],
        providers_failed: [],
        search_time_ms: 0,
        cached: false,
      },
    };
  }
};

// ==================== Legacy API (maintained for backward compatibility) ====================

export const fetchFlights = async (parameters: any) => {
  try {
    const baseUrl = getBaseUrl();
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parameters),
    };
    const response = await fetch(`${baseUrl}/flights/search`, requestOptions);
    const result = await response.json();
    return result.flights;
  } catch (err: any) {
    console.error('Fetch error for', parameters.provider_name, err);
    return [];
  }
};

// ==================== New Database-Backed API ====================

/**
 * Enhanced flight search with database caching
 * Checks database first for fresh data (< 1 hour old), falls back to scraper if needed
 */
export const fetchFlightsEnhanced = async (
  params: FlightSearchParams
): Promise<FlightSearchResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/flights/search-enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('Enhanced search failed:', response.status, response.statusText);
      return null;
    }

    const result: FlightSearchResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching enhanced flights:', err);
    return null;
  }
};

/**
 * Get complete price history for a flight
 * @param baseFlightId - The unique base flight identifier (e.g., "THRMHD20251215MEH41501430")
 * @param query - Optional query parameters (hours_back)
 */
export const fetchFlightPriceHistory = async (
  baseFlightId: string,
  query?: PriceHistoryQuery
): Promise<PriceHistoryResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const params = new URLSearchParams();
    if (query?.hours_back) {
      params.append('hours_back', query.hours_back.toString());
    }

    const url = `${baseUrl}/flights/price-history/${baseFlightId}${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Price history fetch failed:', response.status);
      return null;
    }

    const result: PriceHistoryResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching price history:', err);
    return null;
  }
};

/**
 * Get only price changes (not all snapshots) for a flight
 * @param baseFlightId - The unique base flight identifier
 * @param query - Optional query parameters (hours_back)
 */
export const fetchFlightPriceChanges = async (
  baseFlightId: string,
  query?: PriceHistoryQuery
): Promise<PriceChangesResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const params = new URLSearchParams();
    if (query?.hours_back) {
      params.append('hours_back', query.hours_back.toString());
    }

    const url = `${baseUrl}/flights/price-changes/${baseFlightId}${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Price changes fetch failed:', response.status);
      return null;
    }

    const result: PriceChangesResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching price changes:', err);
    return null;
  }
};

/**
 * Get daily price statistics for a flight
 * @param baseFlightId - The unique base flight identifier
 */
export const fetchFlightDailyStats = async (
  baseFlightId: string
): Promise<DailyStatsResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/flights/daily-stats/${baseFlightId}`);

    if (!response.ok) {
      console.error('Daily stats fetch failed:', response.status);
      return null;
    }

    const result: DailyStatsResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching daily stats:', err);
    return null;
  }
};

/**
 * Compare prices across all providers for a flight
 * @param baseFlightId - The unique base flight identifier
 */
export const fetchFlightPriceComparison = async (
  baseFlightId: string
): Promise<PriceComparisonResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/flights/price-comparison/${baseFlightId}`);

    if (!response.ok) {
      console.error('Price comparison fetch failed:', response.status);
      return null;
    }

    const result: PriceComparisonResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching price comparison:', err);
    return null;
  }
};

/**
 * Get capacity trend (booking velocity) for a flight
 * @param baseFlightId - The unique base flight identifier
 * @param query - Optional query parameters (hours_back)
 */
export const fetchCapacityTrend = async (
  baseFlightId: string,
  query?: PriceHistoryQuery
): Promise<CapacityTrendResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const params = new URLSearchParams();
    if (query?.hours_back) {
      params.append('hours_back', query.hours_back.toString());
    }

    const url = `${baseUrl}/flights/capacity-trend/${baseFlightId}${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Capacity trend fetch failed:', response.status);
      return null;
    }

    const result: CapacityTrendResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching capacity trend:', err);
    return null;
  }
};

/**
 * Find flights with significant price drops
 * @param query - Price drop search criteria
 */
export const fetchPriceDropAlerts = async (
  query: PriceDropQuery
): Promise<PriceDropsResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/flights/price-drops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      console.error('Price drops fetch failed:', response.status);
      return null;
    }

    const result: PriceDropsResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching price drops:', err);
    return null;
  }
};

/**
 * Get scraping performance statistics
 * @param query - Optional query parameters (hours_back)
 */
export const fetchScrapingStats = async (
  query?: ScrapingStatsQuery
): Promise<ScrapingStatsResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const params = new URLSearchParams();
    if (query?.hours_back) {
      params.append('hours_back', query.hours_back.toString());
    }

    const url = `${baseUrl}/flights/stats${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Scraping stats fetch failed:', response.status);
      return null;
    }

    const result: ScrapingStatsResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching scraping stats:', err);
    return null;
  }
};

/**
 * Get comprehensive flight details including price history, comparison, and trends
 * @param baseFlightId - The unique base flight identifier
 */
export const fetchFlightDetails = async (
  baseFlightId: string
): Promise<FlightDetailsResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/flights/details/${baseFlightId}`);

    if (!response.ok) {
      console.error('Flight details fetch failed:', response.status);
      return null;
    }

    const result: FlightDetailsResponse = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching flight details:', err);
    return null;
  }
};
