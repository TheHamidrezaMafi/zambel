import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../models/booking.entity';
import { BOOKING } from 'src/core/constants';

@Injectable()
export class BookingsService {
  constructor(
    @Inject(BOOKING)
    private bookingRepository: Repository<Booking>,
  ) {}

  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    const booking = this.bookingRepository.create(bookingData);
    return this.bookingRepository.save(booking);
  }

  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({ where: { user: { id: userId } } });
  }
}
