import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Airline } from '../models/airline.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AirlineService {
  private logoMap: Record<string, string> = {};

  constructor(
    @InjectRepository(Airline)
    private airlineRepository: Repository<Airline>,
  ) {
    this.loadLogoMap();
  }

  private loadLogoMap() {
    try {
      // Try multiple paths to find the logo map
      const possiblePaths = [
        path.join(__dirname, '../../assets/logos/logo-map.json'),
        path.join(__dirname, '../../../assets/logos/logo-map.json'),
        path.join(process.cwd(), 'dist/assets/logos/logo-map.json'),
        path.join(process.cwd(), 'src/assets/logos/logo-map.json'),
      ];

      for (const logoMapPath of possiblePaths) {
        if (fs.existsSync(logoMapPath)) {
          this.logoMap = JSON.parse(fs.readFileSync(logoMapPath, 'utf-8'));
          console.log(`✅ Loaded ${Object.keys(this.logoMap).length} airline logos from: ${logoMapPath}`);
          return;
        }
      }
      console.warn('⚠️ Logo map file not found in any expected location');
    } catch (error) {
      console.warn('⚠️ Could not load logo map, will use database URLs:', error);
    }
  }

  private getLocalLogoUrl(airline: Airline): string {
    // Try to get local logo URL from logo-map.json
    if (airline.iata_code && this.logoMap[airline.iata_code]) {
      // Convert relative path to absolute URL with backend domain
      const relativePath = this.logoMap[airline.iata_code].replace('./', '/');
      // Use environment variable for backend URL, fallback to localhost
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
      return `${backendUrl}${relativePath}`;
    }
    // Fallback to database URL if no local logo
    return airline.logo_url || '';
  }

  async getAllAirlines(
    page: number = 1,
    limit: number = 10,
    filters?: Partial<Airline>,
  ) {
    const offset = (page - 1) * limit;

    const query = this.airlineRepository.createQueryBuilder('airline');

    // ➡️ فیلترها رو به صورت داینامیک اضافه می‌کنیم
    if (filters.persian_name) {
      query.andWhere('LOWER(airline.persian_name) LIKE LOWER(:persian_name)', {
        persian_name: `%${filters.persian_name}%`,
      });
    }
    if (filters.english_name) {
      query.andWhere('LOWER(airline.english_name) LIKE LOWER(:english_name)', {
        english_name: `%${filters.english_name}%`,
      });
    }
    if (filters.iata_code) {
      query.andWhere('LOWER(airline.iata_code) LIKE LOWER(:iata_code)', {
        iata_code: `%${filters.iata_code}%`,
      });
    }
    if (filters.country_code) {
      query.andWhere('LOWER(airline.country_code) LIKE LOWER(:country_code)', {
        country_code: `%${filters.country_code}%`,
      });
    }
    if (filters.digit_code) {
      query.andWhere('LOWER(airline.digit_code) LIKE LOWER(:digit_code)', {
        digit_code: `%${filters.digit_code}%`,
      });
    }
    if (filters.logo_url) {
      query.andWhere('LOWER(airline.logo_url) LIKE LOWER(:logo_url)', {
        logo_url: `%${filters.logo_url}%`,
      });
    }

    // ➡️ تنظیم Pagination
    const [data, total] = await query
      .take(limit)
      .skip(offset)
      .orderBy('airline.id', 'ASC')
      .getManyAndCount();

    // Map to local logo URLs
    const dataWithLocalLogos = data.map(airline => ({
      ...airline,
      logo_url: this.getLocalLogoUrl(airline),
      original_logo_url: airline.logo_url, // Keep original for reference
    }));

    return {
      data: dataWithLocalLogos,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // async createAirline(data: Partial<Airline>): Promise<Airline> {
  //   const airline = this.airlineRepository.create(data);
  //   return this.airlineRepository.save(airline);
  // }
}
