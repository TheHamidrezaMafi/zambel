import {
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FlightScrapEvent } from '../events/scrap.event';
import * as Moment from 'jalali-moment';

const moment = Moment;
@Injectable()
export class ScraperClientService implements OnModuleInit {
  constructor(private eventEmitter: EventEmitter2) {}

  onModuleInit() {}
  async searchHotels(queryObject): Promise<any> {}

  async searchFlights(
    origin: string,
    destination: string,
    departureDate: string,
    return_date: string,
    others,
  ): Promise<any> {
    const scrapeCreatedEvent = new FlightScrapEvent();
    Object.assign(scrapeCreatedEvent, {
      origin,
      destination,
      departureDate,
      return_date,
      ...others,
    });
    this.eventEmitter.emit('flight.scraper', {
      origin,
      destination,
      departureDate,
      return_date,
      ...others,
    });
    return new HttpException(
      {
        message: 'در حال جستجوی اطلاعات درخواستی شما هستیم...',
      },
      200,
    );
  }
}
