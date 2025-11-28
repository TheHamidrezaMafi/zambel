import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FlightsService } from '../services/flights.service';
import { FlightSearchDTO } from '../dto/flight.dto';

@Controller('flights')
@ApiTags('flights')
export class FlightsController {
  constructor(private flightService: FlightsService) {}

  @Post('search')
  @ApiOperation({ summary: 'جستجوی پرواز' })
  @ApiResponse({ status: 400, description: 'داده‌های جستجو نامعتبر است.' })
  @ApiResponse({ status: 200, description: 'The response from the chatbot' })
  searchFlight(@Body() document: FlightSearchDTO) {
    return this.flightService.searchFlight(document);
  }
}
