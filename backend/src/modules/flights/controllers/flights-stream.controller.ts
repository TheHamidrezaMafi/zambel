import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { FlightStreamService } from '../services/flight-stream.service';

@Controller('flights')
@ApiTags('flights')
export class FlightsStreamController {
  constructor(private readonly flightStreamService: FlightStreamService) {}

  /**
   * Stream flight search results progressively as each provider responds
   * Uses Server-Sent Events (SSE) to push results to the client in real-time
   */
  @Get('search-stream')
  @Sse()
  @ApiOperation({
    summary: 'Progressive Flight Search Stream',
    description: 
      'Search flights with progressive loading. Results are streamed as each provider responds, ' +
      'allowing the frontend to display results immediately without waiting for all providers. ' +
      'Each event contains flights from one provider with metadata about the search progress. ' +
      'Use EventSource to connect to this endpoint from the client.',
  })
  @ApiQuery({ name: 'origin', required: true, description: 'Origin airport code (e.g., THR)' })
  @ApiQuery({ name: 'destination', required: true, description: 'Destination airport code (e.g., MHD)' })
  @ApiQuery({ name: 'departure_date', required: true, description: 'Departure date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'return_date', required: false, description: 'Return date (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Stream of flight search events. Each event contains provider results and metadata.' 
  })
  streamFlightSearch(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('departure_date') departureDate: string,
    @Query('return_date') returnDate?: string,
  ): Observable<MessageEvent> {
    return this.flightStreamService.streamFlightSearch({
      origin,
      destination,
      departure_date: departureDate,
      return_date: returnDate,
    });
  }
}
