import {
  PriceHistoryResponse,
  PriceChangesResponse,
  DailyStatsResponse,
  PriceComparisonResponse,
  CapacityTrendResponse,
  PriceHistoryQuery,
} from '@/types/flight-api.types';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// ==================== Legacy Types (kept for backward compatibility) ====================

export interface PriceHistoryPoint {
  scraped_at: string;
  adult_price: number;
  provider: string;
  available_seats: number;
  is_available: boolean;
}

export interface FlightPriceHistory {
  flight_number: string;
  flight_date: string;
  origin: string;
  destination: string;
  price_history: PriceHistoryPoint[];
  statistics?: {
    current_price: number;
    lowest_price: number;
    highest_price: number;
    average_price: number;
    price_drop_percentage: number;
  };
}

// ==================== Legacy API (kept for backward compatibility) ====================

export const fetchFlightPriceHistory = async (
  flightNumber: string,
  date: string,
  origin: string,
  destination: string
): Promise<FlightPriceHistory | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/flight-tracking/statistics/${flightNumber}/${date}/${origin}/${destination}`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching price history:', err);
    return null;
  }
};

export const fetchLowestPriceHistory = async (
  flightNumber: string,
  date: string,
  origin: string,
  destination: string
) => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/flight-tracking/lowest-price/${flightNumber}/${date}/${origin}/${destination}`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Error fetching lowest price history:', err);
    return null;
  }
};

// ==================== New Database-Backed API ====================

/**
 * Get complete price history for a flight using new database-backed API
 * @param baseFlightId - The unique base flight identifier (e.g., "THRMHD20251215MEH41501430")
 * @param hoursBack - Number of hours to look back (default: 168 = 7 days)
 */
export const fetchPriceHistoryNew = async (
  baseFlightId: string,
  hoursBack: number = 168
): Promise<PriceHistoryResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/flights/price-history/${baseFlightId}?hours_back=${hoursBack}`
    );
    
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
 * @param hoursBack - Number of hours to look back (default: 168 = 7 days)
 */
export const fetchPriceChanges = async (
  baseFlightId: string,
  hoursBack: number = 168
): Promise<PriceChangesResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/flights/price-changes/${baseFlightId}?hours_back=${hoursBack}`
    );
    
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
 * Get daily price statistics with insights
 * @param baseFlightId - The unique base flight identifier
 */
export const fetchDailyStats = async (
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
 * Compare prices across all providers
 * @param baseFlightId - The unique base flight identifier
 */
export const fetchPriceComparison = async (
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
 * @param hoursBack - Number of hours to look back (default: 48 hours)
 */
export const fetchCapacityTrend = async (
  baseFlightId: string,
  hoursBack: number = 48
): Promise<CapacityTrendResponse | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/flights/capacity-trend/${baseFlightId}?hours_back=${hoursBack}`
    );
    
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
