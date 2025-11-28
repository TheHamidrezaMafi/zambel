import { Injectable } from '@nestjs/common';
import { ScraperService } from 'src/modules/scraper/services/scraper.service';

@Injectable()
export class FlightsService {
  constructor(private scraperService: ScraperService) {}

  async searchFlight(data: any) {
    // Check if data is already in scraper format (from frontend)
    if (data.provider_name !== undefined && data.requests) {
      return this.scraperService.takeRequests(data);
    }
    
    // Transform DTO format to scraper format (from Swagger/direct API calls)
    const scraperRequest = {
      provider_name: '', // Empty means all providers
      requests: [
        {
          requested_by_user_id: '1',
          from_date: data.start_date,
          to_date: data.return_date || data.start_date,
          from_destination: data.origin,
          to_destination: data.destination,
          is_foreign_flight: false, // TODO: Determine based on airports
          type: '1',
        },
      ],
    };
    
    return this.scraperService.takeRequests(scraperRequest);
  }
}
