import { Module } from '@nestjs/common';
import { BookingsService } from './services/bookings.service';
import { bookingProviders } from './providers/booking.providers';

@Module({
    providers:[BookingsService,...bookingProviders],
    controllers:[],
    exports:[
        BookingsService
    ]
})
export class BookingsModule {}
