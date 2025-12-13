import { Test, TestingModule } from '@nestjs/testing';
import { PriceHistoryTrackerService } from './price-history-tracker.service';
import { FlightDatabaseRepository } from '../repositories/flight-database.repository';
import { PostgresService } from 'src/core/database/postgres.service';
import { UnifiedFlight } from '../../scraper/interfaces/unified-flight.interface';

describe('PriceHistoryTrackerService', () => {
  let service: PriceHistoryTrackerService;
  let mockFlightDatabase: jest.Mocked<FlightDatabaseRepository>;
  let mockPostgres: jest.Mocked<PostgresService>;

  // Sample flight data for testing
  const mockFlight: UnifiedFlight = {
    base_flight_id: 'flight-base-001',
    flight_id: 'flight-001',
    provider_source: 'provider-a',
    original_id: 'provider-a-001',
    flight_number: 'IR101',
    airline: {
      code: 'IR',
      name_en: 'Iran Air',
      name_fa: 'ایران ایر',
    },
    route: {
      origin: {
        airport_code: 'THR',
        airport_name_en: 'Imam Khomeini',
        airport_name_fa: 'امام خمینی',
        city_code: 'THR',
        city_name_en: 'Tehran',
        city_name_fa: 'تهران',
      },
      destination: {
        airport_code: 'MHD',
        airport_name_en: 'Mashhad',
        airport_name_fa: 'مشهد',
        city_code: 'MHD',
        city_name_en: 'Mashhad',
        city_name_fa: 'مشهد',
      },
    },
    schedule: {
      departure_datetime: '2025-12-15T10:00:00Z',
      arrival_datetime: '2025-12-15T11:30:00Z',
      duration_minutes: 90,
      stops: 0,
    },
    pricing: {
      adult: {
        base_fare: 1000000,
        total_fare: 1150000,
      },
      currency: 'IRR',
    },
    cabin: {
      class: 'economy',
    },
    ticket_info: {
      type: 'normal',
      is_charter: false,
      is_refundable: true,
      capacity: 15,
      reservable: true,
    },
    metadata: {
      original_id: 'provider-a-001',
      scraped_at: new Date().toISOString(),
    },
  };

  beforeEach(async () => {
    // Mock PostgresService
    mockPostgres = {
      queryOne: jest.fn(),
      queryMany: jest.fn(),
      query: jest.fn(),
    } as any;

    // Mock FlightDatabaseRepository
    mockFlightDatabase = {
      findCheapestFlights: jest.fn(),
      getFlightPriceHistory: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceHistoryTrackerService,
        { provide: FlightDatabaseRepository, useValue: mockFlightDatabase },
        { provide: PostgresService, useValue: mockPostgres },
      ],
    }).compile();

    service = module.get<PriceHistoryTrackerService>(PriceHistoryTrackerService);
  });

  describe('recordSearchResults', () => {
    it('should return 0 saved and 0 skipped for empty flights array', async () => {
      const result = await service.recordSearchResults([], 'THR', 'MHD', '2025-12-15');
      expect(result.saved).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should return 0 saved and 0 skipped for undefined flights', async () => {
      const result = await service.recordSearchResults(undefined as any, 'THR', 'MHD', '2025-12-15');
      expect(result.saved).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should attempt to record valid flights', async () => {
      mockPostgres.queryOne
        .mockResolvedValueOnce({ count: 0 }) // No recent record
        .mockResolvedValueOnce({ id: 'tracked-flight-id' }); // Tracked flight created
      mockPostgres.query.mockResolvedValue(undefined);

      const result = await service.recordSearchResults([mockFlight], 'THR', 'MHD', '2025-12-15');

      expect(result.saved).toBe(1);
      expect(result.skipped).toBe(0);
      expect(mockPostgres.queryOne).toHaveBeenCalled();
      expect(mockPostgres.query).toHaveBeenCalled();
    });
  });

  describe('getCacheAge', () => {
    it('should return -1 for non-existent records', async () => {
      mockPostgres.queryOne.mockResolvedValue({ age_minutes: null });

      const age = await service.getCacheAge('THR', 'MHD', '2025-12-15');
      expect(age).toBe(-1);
    });

    it('should return correct cache age in minutes', async () => {
      mockPostgres.queryOne.mockResolvedValue({ age_minutes: 30 });

      const age = await service.getCacheAge('THR', 'MHD', '2025-12-15');
      expect(age).toBe(30);
    });

    it('should return -1 on database error', async () => {
      mockPostgres.queryOne.mockRejectedValue(new Error('Database error'));

      const age = await service.getCacheAge('THR', 'MHD', '2025-12-15');
      expect(age).toBe(-1);
    });
  });

  describe('recordBatchSearchResults', () => {
    it('should record multiple search results', async () => {
      mockPostgres.queryOne
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ id: 'tracked-flight-1' })
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ id: 'tracked-flight-2' });
      mockPostgres.query.mockResolvedValue(undefined);

      const searchResults = [
        {
          flights: [mockFlight],
          origin: 'THR',
          destination: 'MHD',
          flightDate: '2025-12-15',
        },
        {
          flights: [{ ...mockFlight, flight_id: 'flight-002' }],
          origin: 'THR',
          destination: 'ISF',
          flightDate: '2025-12-15',
        },
      ];

      const result = await service.recordBatchSearchResults(searchResults);

      expect(result.total_saved).toBe(2);
      expect(result.total_skipped).toBe(0);
    });
  });

  describe('data validation', () => {
    it('should skip invalid flights (missing flight_number)', async () => {
      const invalidFlight = { ...mockFlight, flight_number: '' };
      const result = await service.recordSearchResults([invalidFlight], 'THR', 'MHD', '2025-12-15');

      expect(result.saved).toBe(0);
    });

    it('should skip invalid flights (missing origin)', async () => {
      const invalidFlight = { ...mockFlight, route: { ...mockFlight.route, origin: null } };
      const result = await service.recordSearchResults([invalidFlight as any], 'THR', 'MHD', '2025-12-15');

      expect(result.saved).toBe(0);
    });

    it('should skip invalid flights (invalid price)', async () => {
      const invalidFlight = {
        ...mockFlight,
        pricing: { ...mockFlight.pricing, adult: { ...mockFlight.pricing.adult, total_fare: 0 } },
      };
      const result = await service.recordSearchResults([invalidFlight], 'THR', 'MHD', '2025-12-15');

      expect(result.saved).toBe(0);
    });
  });

  describe('recent record detection', () => {
    it('should skip recording if recent record exists', async () => {
      mockPostgres.queryOne.mockResolvedValue({ count: 1 }); // Recent record exists

      const result = await service.recordSearchResults([mockFlight], 'THR', 'MHD', '2025-12-15');

      expect(result.saved).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should record if no recent record exists', async () => {
      mockPostgres.queryOne
        .mockResolvedValueOnce({ count: 0 }) // No recent record
        .mockResolvedValueOnce({ id: 'tracked-flight-id' });
      mockPostgres.query.mockResolvedValue(undefined);

      const result = await service.recordSearchResults([mockFlight], 'THR', 'MHD', '2025-12-15');

      expect(result.saved).toBe(1);
      expect(result.skipped).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully during recording', async () => {
      mockPostgres.queryOne.mockRejectedValue(new Error('Database error'));

      const result = await service.recordSearchResults([mockFlight], 'THR', 'MHD', '2025-12-15');

      // Should not throw, but return 0 saved
      expect(result.saved).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should continue processing after individual flight errors', async () => {
      mockPostgres.queryOne
        .mockResolvedValueOnce({ count: 0 })
        .mockRejectedValueOnce(new Error('Error')) // Error on first flight
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ id: 'tracked-flight-2' });
      mockPostgres.query.mockResolvedValue(undefined);

      const flights = [mockFlight, { ...mockFlight, flight_id: 'flight-002' }];

      const result = await service.recordSearchResults(flights, 'THR', 'MHD', '2025-12-15');

      // Second flight should still be processed
      expect(result.saved + result.skipped).toBeGreaterThan(0);
    });
  });
});
