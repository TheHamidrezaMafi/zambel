import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  FlightProcessedByUserReqeust,
  FlightProcessed,
  GetRequestedFlightsByUserResponse,
  ScraperGrpcService,
} from '../interfaces/scraper.interface';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class ScraperService implements OnModuleInit {
  private scraperService: ScraperGrpcService;

  constructor(@Inject('SCRAPER_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.scraperService =
      this.client.getService<ScraperGrpcService>('ScraperService');
  }

  /**
   * Normalize airline name to handle variations
   * Handles cases like:
   * - "سپهران ایر" -> "سپهران"
   * - "چابهار ایرلاینز" -> "چابهار"
   * - "ایران ایر" -> "ایران"
   */
  private normalizeAirlineName(airlineName: string): string {
    if (!airlineName) return airlineName;
    
    // Remove common suffixes
    const suffixesToRemove = [
      ' ایر',
      ' ایرلاین',
      ' ایرلاینز',
      ' airlines',
      ' airline',
      ' air',
      ' airways',
    ];
    
    let normalized = airlineName.trim();
    
    // Normalize Persian/Arabic character variations
    normalized = normalized
      .replace(/ي/g, 'ی')  // Arabic Ya (U+064A) to Persian Ya (U+06CC)
      .replace(/ك/g, 'ک')  // Arabic Kaf (U+0643) to Persian Kaf (U+06A9)
      .replace(/[آأإٱ]/g, 'ا')  // All Alef variations to plain Alef
      .replace(/ة/g, 'ه')  // Ta Marbuta to Ha
      .replace(/ؤ/g, 'و')  // Waw with Hamza to Waw
      .replace(/ئ/g, 'ی'); // Ya with Hamza to Ya
    
    for (const suffix of suffixesToRemove) {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length).trim();
        break; // Only remove one suffix
      }
    }
    
    return normalized;
  }

  /**
   * Normalize flight number to handle various formats
   * Core principle: Flight numbers are 3-4 digits. Handle airline codes with embedded digits.
   * 
   * Examples:
   * - IR263, 263 -> 263
   * - W51036, 1036 -> 1036 (51036->1036)
   * - I35699, 5699 -> 5699 (35699->5699)
   * - IV29, IV029 -> 29
   * - B9960, 960 -> 960 (9960->960)
   * - AX7730, 7730 -> 7730
   * - IS4344, 4344 -> 4344
   * - J12805, JI2805 -> 2805 (12805->2805)
   */
  private normalizeFlightNumber(flightNumber: string): string {
    if (!flightNumber) return flightNumber;
    
    // Step 1: Remove all letters
    const numericPart = flightNumber.replace(/[A-Za-z]/g, '');
    
    // Step 2: Remove leading zeros
    const withoutLeadingZeros = numericPart.replace(/^0+/, '') || '0';
    
    // Step 3: Handle 5-digit numbers (airline code + 4-digit flight number)
    if (withoutLeadingZeros.length === 5 && 
        withoutLeadingZeros[0] >= '1' && 
        withoutLeadingZeros[0] <= '9') {
      return withoutLeadingZeros.slice(1).replace(/^0+/, '') || '0';
    }
    
    // Step 4: Handle 4-digit numbers starting with 9 (B9 airline code)
    // B9 is a common airline code, so 9xxx is likely 9+xxx
    if (withoutLeadingZeros.length === 4 && 
        withoutLeadingZeros[0] === '9') {
      const result = withoutLeadingZeros.slice(1).replace(/^0+/, '') || '0';
      // Only use if result is 3 digits (valid flight number)
      if (result.length === 3) {
        return result;
      }
    }
    
    return withoutLeadingZeros;
  }

  /**
   * Normalize flight data in the response
   * Converts flight numbers and airline names to standardized formats
   * This allows the frontend to properly group flights from different providers
   */
  private normalizeFlightData(flights: FlightProcessed[]): FlightProcessed[] {
    return flights.map(flight => {
      const normalizedNumber = this.normalizeFlightNumber(flight.flight_number);
      const normalizedAirline = this.normalizeAirlineName(flight.airline_name_fa);
      return {
        ...flight,
        flight_number: normalizedNumber,
        original_flight_number: flight.flight_number,
        airline_name_fa: normalizedAirline,
      };
    });
  }

  /**
   * Sort flights by departure time
   */
  private sortFlightsByDepartureTime(flights: FlightProcessed[]): FlightProcessed[] {
    return flights.sort((a, b) => {
      const dateA = new Date(a.departure_date_time).getTime();
      const dateB = new Date(b.departure_date_time).getTime();
      return dateA - dateB;
    });
  }

  async takeRequests(
    data: GetRequestedFlightsByUserResponse,
  ): Promise<FlightProcessedByUserReqeust> {
    const { requests, provider_name } = data;
    const {
      requested_by_user_id,
      from_date,
      to_date,
      from_destination,
      to_destination,
      is_foreign_flight,
      type,
    } = requests[0];

    const request = {
      provider_name,
      requests: [
        {
          requested_by_user_id,
          from_date,
          to_date,
          from_destination,
          to_destination,
          is_foreign_flight: is_foreign_flight.toString() === 'true',
          type,
        },
      ],
    };

    try {
      const observable$ = this.scraperService.TakeRequests(request);
      const response = await firstValueFrom(observable$);

      // Apply normalization and sorting
      if (response.flights && response.flights.length > 0) {
        let processedFlights = this.normalizeFlightData(response.flights);
        processedFlights = this.sortFlightsByDepartureTime(processedFlights);
        return { flights: processedFlights };
      }

      return response;
    } catch (error) {
      console.log('Request: ', request);
      console.log('Error: ', error);

      return { flights: [] };
    }
  }
}
