import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { AirlineService } from '../services/airline.service';
import { Airline } from '../models/airline.entity';

@Controller('airlines')
export class AirlineController {
  constructor(private airlineService: AirlineService) {}

  @Get()
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('persian_name') persian_name?: string,
    @Query('english_name') english_name?: string,
    @Query('iata_code') iata_code?: string,
    @Query('country_code') country_code?: string,
    @Query('digit_code') digit_code?: string,
    @Query('logo_url') logo_url?: string,
  ) {
    const filters: Partial<Airline> = {
      persian_name,
      english_name,
      iata_code,
      country_code,
      digit_code,
      logo_url,
    };
    return this.airlineService.getAllAirlines(page, limit, filters);
  }

  // @Post()
  // async create(@Body() data: Partial<Airline>): Promise<Airline> {
  //   return this.airlineService.createAirline(data);
  // }
}
