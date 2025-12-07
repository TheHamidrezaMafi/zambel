import { FlightData } from '@/types/flight-response';

export type ResultListProperties = {
  list: Array<FlightData>;
  isLoading: boolean;
};
