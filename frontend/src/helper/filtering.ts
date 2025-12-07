import { FlightData } from "@/types/flight-response";
import { ParsedUrlQuery } from "querystring";
import { normalizeAirlineName } from "./utils";

const filterByAirline = (flights: Array<FlightData>, airlines: string) => {
  const airlineList = airlines.split(",").filter(Boolean);
  if (airlineList.length === 0) return flights;
  return flights.filter((flight) => {
    const normalizedAirline = normalizeAirlineName(flight.airline_name_fa);
    return airlineList.includes(normalizedAirline);
  });
};
const filterByProvider = (flights: Array<FlightData>, providers: string) => {
  const providerList = providers.split(",").filter(Boolean);
  if (providerList.length === 0) return flights;
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
