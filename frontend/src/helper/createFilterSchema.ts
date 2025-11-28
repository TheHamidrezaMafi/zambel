import { FlightData } from '@/types/flight-response';

const getAirlines = (flights: Array<FlightData>) => {
  const uniqueAirlines: Array<string> = [];
  flights.map((flight) => {
    const { airline_name_fa } = flight;
    if (uniqueAirlines.includes(airline_name_fa)) {
      return;
    }
    uniqueAirlines.push(airline_name_fa);
  });
  return uniqueAirlines;
};
const getProvider = (flights: Array<FlightData>) => {
  const uniqueProviders: Array<string> = [];
  flights.map((flight) => {
    const { provider_name } = flight;
    if (uniqueProviders.includes(provider_name)) {
      return;
    }
    uniqueProviders.push(provider_name);
  });
  return uniqueProviders;
};
export const createFilterSchema = (flights: Array<FlightData>) => {
  return {
    airlines: getAirlines(flights),
    providers: getProvider(flights),
  };
};
