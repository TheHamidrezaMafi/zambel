import { FlightData } from '@/types/flight-response';
import { getAdultPrice } from './utils';

export const sortFlights = (flights: Array<FlightData>, sortBy: string) => {
  const sortedFlights = [...flights];
  switch (sortBy) {
    case 'lowest_price':
      return sortedFlights.sort((a, b) => getAdultPrice(a) - getAdultPrice(b));
    case 'highest_price':
      return sortedFlights.sort((a, b) => getAdultPrice(b) - getAdultPrice(a));
    case 'earliest':
      return sortedFlights.sort(
        (a, b) =>
          new Date(a.departure_date_time).getTime() -
          new Date(b.departure_date_time).getTime()
      );
    case 'latest':
      return sortedFlights.sort(
        (a, b) =>
          new Date(b.departure_date_time).getTime() -
          new Date(a.departure_date_time).getTime()
      );
    default:
      return flights;
  }
};
