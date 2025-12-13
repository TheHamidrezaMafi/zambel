import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { GroupedFlight, SearchMetadata } from '@/types/unified-flight.types';

interface StreamEvent {
  type: 'provider_result' | 'search_complete' | 'error' | 'progress';
  provider?: string;
  flights?: GroupedFlight[];
  metadata?: any;
  progress?: {
    completed: number;
    total: number;
    providers_completed: string[];
    providers_remaining: string[];
  };
  error?: string;
  timestamp: string;
}

interface ProviderProgress {
  name: string;
  status: 'pending' | 'loading' | 'completed' | 'failed';
  flightCount?: number;
  scrapeTime?: number;
}

export const useStreamingFlights = () => {
  const [flights, setFlights] = useState<GroupedFlight[]>([]);
  const [metadata, setMetadata] = useState<SearchMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerProgress, setProviderProgress] = useState<ProviderProgress[]>([]);
  const [completedProviders, setCompletedProviders] = useState<number>(0);
  const [totalProviders, setTotalProviders] = useState<number>(4);

  const eventSourceRef = useRef<EventSource | null>(null);
  const flightsMapRef = useRef<Map<string, GroupedFlight>>(new Map());

  const { query } = useRouter();
  const {
    departureDate,
    returnDate,
    origin = '',
    destination = '',
  } = query ?? {};

  /**
   * Merge new flights with existing flights
   * Updates flights with the same base_flight_id by adding new pricing options
   */
  const mergeFlights = useCallback((newFlights: GroupedFlight[]) => {
    const flightsMap = flightsMapRef.current;

    newFlights.forEach((newFlight) => {
      const existingFlight = flightsMap.get(newFlight.base_flight_id);

      if (existingFlight) {
        // Merge pricing options
        const existingProviders = new Set(
          existingFlight.pricingOptions.map((opt) => opt.provider),
        );

        newFlight.pricingOptions.forEach((newOption) => {
          if (!existingProviders.has(newOption.provider)) {
            existingFlight.pricingOptions.push(newOption);
          }
        });

        // Update price range
        const allPrices = existingFlight.pricingOptions.map((opt) => opt.price);
        existingFlight.lowestPrice = Math.min(...allPrices);
        existingFlight.highestPrice = Math.max(...allPrices);

        // Update available providers count
        const uniqueProviders = new Set(
          existingFlight.pricingOptions.map((opt) => opt.provider),
        );
        existingFlight.availableProviders = uniqueProviders.size;
      } else {
        // Add new flight
        flightsMap.set(newFlight.base_flight_id, { ...newFlight });
      }
    });

    // Convert map to array and sort by lowest price
    const mergedFlights = Array.from(flightsMap.values()).sort(
      (a, b) => a.lowestPrice - b.lowestPrice,
    );

    return mergedFlights;
  }, []);

  const fetchData = useCallback(async () => {
    const _origin = Array.isArray(origin) ? origin[0] : origin;
    const _destination = Array.isArray(destination) ? destination[0] : destination;
    const _departureDate = Array.isArray(departureDate) ? departureDate[0] : departureDate;
    const _returnDate = Array.isArray(returnDate) ? returnDate[0] : returnDate;

    if (!_departureDate || !_origin || !_destination) {
      setIsLoading(false);
      return;
    }

    // Reset state
    setIsLoading(true);
    setError(null);
    setFlights([]);
    setCompletedProviders(0);
    flightsMapRef.current.clear();
    setProviderProgress([
      { name: 'alibaba', status: 'pending' },
      { name: 'mrbilit', status: 'pending' },
      { name: 'safar366', status: 'pending' },
      { name: 'safarmarket', status: 'pending' },
    ]);

    // Save to search history
    try {
      const searchHistory = localStorage.getItem('searchHistory');
      let parsedHistory = searchHistory ? JSON.parse(searchHistory) : [];

      if (
        !parsedHistory.some(
          (item: any) =>
            item.from_destination === _origin &&
            item.to_destination === _destination &&
            item.from_date === _departureDate,
        )
      ) {
        parsedHistory.unshift({
          from_destination: _origin,
          to_destination: _destination,
          from_date: _departureDate,
          to_date: _returnDate,
        });

        const now = new Date();
        parsedHistory = parsedHistory.filter(
          (item: any) =>
            new Date(item.from_date).setHours(23, 59, 59, 999) >= now.getTime(),
        );
        parsedHistory = parsedHistory.slice(0, 5);
        localStorage.setItem('searchHistory', JSON.stringify(parsedHistory));
      }
    } catch (err) {
      console.error('Error saving to history:', err);
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create EventSource for streaming
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const url = new URL('/flights/search-stream', baseUrl);
    url.searchParams.append('origin', _origin);
    url.searchParams.append('destination', _destination);
    url.searchParams.append('departure_date', _departureDate);
    if (_returnDate) {
      url.searchParams.append('return_date', _returnDate);
    }

    const eventSource = new EventSource(url.toString());
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'provider_result':
            if (data.provider && data.flights) {
              // Update provider progress
              setProviderProgress((prev) =>
                prev.map((p) =>
                  p.name === data.provider
                    ? {
                        ...p,
                        status: 'completed',
                        flightCount: data.flights?.length || 0,
                        scrapeTime: data.metadata?.scrape_time_seconds,
                      }
                    : p,
                ),
              );

              // Merge flights
              const merged = mergeFlights(data.flights);
              setFlights(merged);

              console.log(
                `✅ ${data.provider}: ${data.flights.length} flights received`,
              );
            }
            break;

          case 'progress':
            if (data.progress) {
              setCompletedProviders(data.progress.completed);
              setTotalProviders(data.progress.total);

              // Update loading providers
              data.progress.providers_remaining.forEach((provider) => {
                setProviderProgress((prev) =>
                  prev.map((p) =>
                    p.name === provider && p.status === 'pending'
                      ? { ...p, status: 'loading' }
                      : p,
                  ),
                );
              });
            }
            break;

          case 'search_complete':
            setIsLoading(false);
            setMetadata({
              total_flights: flightsMapRef.current.size,
              total_options: Array.from(flightsMapRef.current.values()).reduce(
                (sum, f) => sum + f.pricingOptions.length,
                0,
              ),
              providers_queried: data.metadata?.total_providers || 4,
              providers_successful:
                data.metadata?.providers_successful || [],
              providers_failed: data.metadata?.providers_failed || [],
              search_time_ms: data.metadata?.total_time_ms || 0,
              cached: false,
            });
            eventSource.close();
            console.log('🎉 Search completed');
            break;

          case 'error':
            setError(data.error || 'Unknown error');
            setIsLoading(false);
            eventSource.close();
            console.error('❌ Search error:', data.error);
            break;
        }
      } catch (err) {
        console.error('Error parsing event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      setError('Connection error. Please try again.');
      setIsLoading(false);
      eventSource.close();
    };
  }, [departureDate, destination, origin, returnDate, mergeFlights]);

  useEffect(() => {
    fetchData();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchData]);

  return {
    flights,
    metadata,
    isLoading,
    error,
    providerProgress,
    completedProviders,
    totalProviders,
    refetch: fetchData,
  };
};
