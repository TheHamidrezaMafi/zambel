import { Controller, Get, Query } from '@nestjs/common';
import { AirportService } from './airport.service';

@Controller('airports')
export class AirportController {
  constructor(private airportService: AirportService) {}

  @Get()
  async getAirports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('iata_code') iata_code?: string,
    @Query('icao_code') icao_code?: string,
    @Query('persian_name') persian_name?: string,
    @Query('english_name') english_name?: string,
    @Query('country_code') country_code?: string,
    @Query('time_zone') time_zone?: number,
    @Query('latitude') latitude?: number,
    @Query('location_type_id') location_type_id?: number,
    @Query('altitude') altitude?: number,
    @Query('order_show') order_show?: number,
  ) {
    const filters = {
      iata_code,
      icao_code,
      persian_name,
      english_name,
      country_code,
      time_zone,
      latitude,
      location_type_id,
      altitude,
      order_show,
    };

    return this.airportService.getAirports(page, limit, filters);
  }
}
