import { FLIGHT_REPOSITORY } from "src/core/constants";
import { Flights } from "../models/flight.entity";

export const flightProviders = [{
    provide: FLIGHT_REPOSITORY,
    useValue: Flights,
}];