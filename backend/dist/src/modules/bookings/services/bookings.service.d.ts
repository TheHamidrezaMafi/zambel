import { Repository } from 'typeorm';
import { Booking } from '../models/booking.entity';
export declare class BookingsService {
    private bookingRepository;
    constructor(bookingRepository: Repository<Booking>);
    createBooking(bookingData: Partial<Booking>): Promise<Booking>;
    getBookingsByUserId(userId: number): Promise<Booking[]>;
}
