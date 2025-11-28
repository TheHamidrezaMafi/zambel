import { filtering } from '@/helper/filtering';
import { sortFlights } from '@/helper/sorting';
import { getAdultPrice } from '@/helper/utils';
import { FlightData } from '@/types/flight-response';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export const useListing = (flights: Array<FlightData>) => {
  const router = useRouter();
  const orderBy = (router.query.orderBy as string) || 'lowest_price';
  const unavailableTicket = useMemo(() => {
    return flights.filter(
      (item) => getAdultPrice(item) === 0 || item.capacity <= 0
    );
  }, [flights]);
  const availableTickets = useMemo(() => {
    return flights.filter(
      (item) => getAdultPrice(item) !== 0 && item.capacity > 0
    );
  }, [flights]);
  const filteredFlights = useMemo(() => {
    return filtering(availableTickets, router.query);
  }, [availableTickets, router.query]);

  const sortedFlights = useMemo(() => {
    return sortFlights(filteredFlights, orderBy);
  }, [filteredFlights, orderBy]);

  return { flights: sortedFlights, unavailableTicket };
};
