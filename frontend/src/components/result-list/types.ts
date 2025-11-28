import { FlightData } from '@/types/flight-response';

export type ResultListProperties = {
  list: Array<FlightData>;
  isLoading: boolean;
  unAvailableList: Array<FlightData>;
  isUnavailable: boolean;
  setFlightsCount: React.Dispatch<React.SetStateAction<number>>;
};
