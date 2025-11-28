import { BOOKING } from "src/core/constants";
import { Booking } from "../models/booking.entity";


export const bookingProviders = [{
    provide: BOOKING,
    useValue: Booking,
}];
