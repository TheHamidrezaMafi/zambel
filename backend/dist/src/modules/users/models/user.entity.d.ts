import { Booking } from 'src/modules/bookings/models/booking.entity';
export declare class User {
    id: number;
    name: string;
    email: string;
    bookings: Booking[];
}
