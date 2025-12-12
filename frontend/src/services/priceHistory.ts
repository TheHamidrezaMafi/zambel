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

export const fetchFlightPriceHistory = async (
  flightNumber: string,
  date: string,
  origin: string,
  destination: string
): Promise<FlightPriceHistory | null> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
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
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
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
