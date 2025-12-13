import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Airport } from './airport.entity';

@Injectable()
export class AirportService {
  constructor(
    @InjectRepository(Airport)
    private airportRepository: Repository<Airport>,
  ) {}

  async getAirports(
    page: number = 1,
    limit: number = 10,
    filters?: Partial<Airport>,
  ) {
    const offset = (page - 1) * limit;

    const query = this.airportRepository.createQueryBuilder('airport');

    // Map old field names to new ones for backward compatibility
    if (filters['iata_code'] || filters['code']) {
      const code = filters['iata_code'] || filters['code'];
      query.andWhere('LOWER(airport.code) LIKE LOWER(:code)', {
        code: `%${code}%`,
      });
    }
    if (filters['icao_code']) {
      query.andWhere('LOWER(airport.code) LIKE LOWER(:code)', {
        code: `%${filters['icao_code']}%`,
      });
    }
    if (filters['persian_name'] || filters['name_fa']) {
      const nameFa = filters['persian_name'] || filters['name_fa'];
      query.andWhere('LOWER(airport.name_fa) LIKE LOWER(:name_fa)', {
        name_fa: `%${nameFa}%`,
      });
    }
    if (filters['english_name'] || filters['name_en']) {
      const nameEn = filters['english_name'] || filters['name_en'];
      query.andWhere('LOWER(airport.name_en) LIKE LOWER(:name_en)', {
        name_en: `%${nameEn}%`,
      });
    }
    if (filters['country_code'] || filters['country']) {
      const country = filters['country_code'] || filters['country'];
      query.andWhere('LOWER(airport.country) LIKE LOWER(:country)', {
        country: `%${country}%`,
      });
    }
    if (filters['city_code']) {
      query.andWhere('LOWER(airport.city_code) LIKE LOWER(:city_code)', {
        city_code: `%${filters['city_code']}%`,
      });
    }

    const [data, total] = await query
      .take(limit)
      .skip(offset)
      .orderBy('airport.city_code', 'ASC')
      .getManyAndCount();

    // Transform data to include both old and new field names for backward compatibility
    const transformedData = data.map(airport => ({
      ...airport,
      // Add old field names as aliases
      iata_code: airport.code,
      icao_code: airport.code,
      // For display: use city name (not airport name) - this is what users expect to see
      persian_name: airport.city_name_fa,
      english_name: airport.city_name_en,
      // Convert country name to ISO code for frontend filtering
      // Iran = 'IR', all others = 'INTL' (for international filtering)
      country_code: airport.country === 'Iran' ? 'IR' : 'INTL',
    }));

    return {
      data: transformedData,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }
}