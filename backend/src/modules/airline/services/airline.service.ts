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
    if (filters.persian_name || filters['name_fa']) {
      const nameFa = filters.persian_name || filters['name_fa'];
      query.andWhere('LOWER(airline.name_fa) LIKE LOWER(:name_fa)', {
        name_fa: `%${nameFa}%`,
      });
    }
    if (filters.english_name || filters['name_en']) {
      const nameEn = filters.english_name || filters['name_en'];
      query.andWhere('LOWER(airline.name_en) LIKE LOWER(:name_en)', {
        name_en: `%${nameEn}%`,
      });
    }
    if (filters.iata_code || filters['code']) {
      const code = filters.iata_code || filters['code'];
      query.andWhere('LOWER(airline.code) LIKE LOWER(:code)', {
        code: `%${code}%`,
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
