import { FlightData } from "@/types/flight-response";
import { ParsedUrlQuery } from "querystring";

const filterByAirline = (flights: Array<FlightData>, airlines: string) => {
  const airlineList = airlines.split(",");
  return flights.filter((flight) => airlineList.includes(flight.airline_name_fa));
};
const filterByProvider = (flights: Array<FlightData>, providers: string) => {
  const providerList = providers.split(",");
  return flights.filter((flight) => providerList.includes(flight.provider_name));
};
export const filtering = (
  flights: Array<FlightData>,
  query: ParsedUrlQuery
) => {
  const { airlines, providers } = query;
  let filteredFlights = [...flights];
  if (airlines) {
    filteredFlights = filterByAirline(filteredFlights, airlines as string);
  }
  if (providers) {
    filteredFlights = filterByProvider(filteredFlights, providers as string);
  }
  return filteredFlights;
};
