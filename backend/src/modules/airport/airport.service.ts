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

    if (filters.iata_code) {
      query.andWhere('LOWER(airport.iata_code) LIKE LOWER(:iata_code)', {
        iata_code: `%${filters.iata_code}%`,
      });
    }
    if (filters.icao_code) {
      query.andWhere('LOWER(airport.icao_code) LIKE LOWER(:icao_code)', {
        icao_code: `%${filters.icao_code}%`,
      });
    }
    if (filters.persian_name) {
      query.andWhere('LOWER(airport.persian_name) LIKE LOWER(:persian_name)', {
        persian_name: `%${filters.persian_name}%`,
      });
    }
    if (filters.english_name) {
      query.andWhere('LOWER(airport.english_name) LIKE LOWER(:english_name)', {
        english_name: `%${filters.english_name}%`,
      });
    }
    if (filters.country_code) {
      query.andWhere('LOWER(airport.country_code) LIKE LOWER(:country_code)', {
        country_code: `%${filters.country_code}%`,
      });
    }
    if (filters.time_zone) {
      query.andWhere('airport.time_zone = :time_zone', {
        time_zone: filters.time_zone,
      });
    }
    if (filters.latitude) {
      query.andWhere('airport.latitude = :latitude', {
        latitude: filters.latitude,
      });
    }
    if (filters.location_type_id) {
      query.andWhere('airport.location_type_id = :location_type_id', {
        location_type_id: filters.location_type_id,
      });
    }
    if (filters.altitude) {
      query.andWhere('airport.altitude = :altitude', {
        altitude: filters.altitude,
      });
    }
    if (filters.order_show) {
      query.andWhere('airport.order_show = :order_show', {
        order_show: filters.order_show,
      });
    }

    const [data, total] = await query
      .take(limit)
      .skip(offset)
      .orderBy('airport.order_show', 'ASC') 
      .getManyAndCount();

    return {
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
