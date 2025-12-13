import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { fetchFlightsUnified } from '../services/flights';
import { GroupedFlight, SearchMetadata } from '@/types/unified-flight.types';

export const useUnifiedFlights = () => {
  const [flights, setFlights] = useState<GroupedFlight[]>([]);
  const [metadata, setMetadata] = useState<SearchMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { query } = useRouter();
  const {
    departureDate,
    returnDate,
    origin = '',
    destination = '',
  } = query ?? {};

  const fetchData = useCallback(async () => {
    const _origin = Array.isArray(origin) ? origin[0] : origin;
    const _destination = Array.isArray(destination) ? destination[0] : destination;
    const _departureDate = Array.isArray(departureDate) ? departureDate[0] : departureDate;
    const _returnDate = Array.isArray(returnDate) ? returnDate[0] : returnDate;

    if (!_departureDate || !_origin || !_destination) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Save to search history
      const searchHistory = localStorage.getItem('searchHistory');
      let parsedHistory = searchHistory ? JSON.parse(searchHistory) : [];
      
      if (
        !parsedHistory.some(
          (item: any) =>
            item.from_destination === _origin &&
            item.to_destination === _destination &&
            item.from_date === _departureDate
        )
      ) {
        parsedHistory.unshift({
          from_destination: _origin,
          to_destination: _destination,
          from_date: _departureDate,
          to_date: _returnDate,
        });
        
        // Filter out past dates and keep only 5 most recent
        const now = new Date();
        parsedHistory = parsedHistory.filter(
          (item: any) =>
            new Date(item.from_date).setHours(23, 59, 59, 999) >= now.getTime()
        );
        parsedHistory = parsedHistory.slice(0, 5);
        localStorage.setItem('searchHistory', JSON.stringify(parsedHistory));
      }

      const result = await fetchFlightsUnified({
        origin: _origin,
        destination: _destination,
        start_date: _departureDate,
        return_date: _returnDate || undefined,
        adult: 1,
      });

      setFlights(result.flights);
      setMetadata(result.metadata);
    } catch (err: any) {
      console.error('Error fetching flights:', err);
      setError(err.message || 'Failed to fetch flights');
      setFlights([]);
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, [departureDate, destination, origin, returnDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { flights, metadata, isLoading, error, refetch: fetchData };
};
