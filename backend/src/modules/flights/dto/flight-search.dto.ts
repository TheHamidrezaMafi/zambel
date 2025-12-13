import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FlightSearchDto {
  @ApiProperty({ example: 'THR', description: 'Origin airport code (IATA)' })
  @IsString()
  origin: string;

  @ApiProperty({ example: 'MHD', description: 'Destination airport code (IATA)' })
  @IsString()
  destination: string;

  @ApiProperty({ example: '2025-12-15', description: 'Departure date (YYYY-MM-DD)' })
  @IsDateString()
  departure_date: string;

  @ApiPropertyOptional({ example: '2025-12-20', description: 'Return date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  return_date?: string;

  @ApiProperty({ example: 1, description: 'Number of adult passengers' })
  @IsNumber()
  @Min(1)
  @Max(9)
  adults: number = 1;

  @ApiPropertyOptional({ example: 0, description: 'Number of child passengers' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9)
  children?: number = 0;

  @ApiPropertyOptional({ example: 0, description: 'Number of infant passengers' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9)
  infants?: number = 0;

  @ApiPropertyOptional({ description: 'Specific provider to search (empty for all)' })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class PriceHistoryQueryDto {
  @ApiPropertyOptional({ example: 168, description: 'Hours to look back (default: 168 = 7 days)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(720) // Max 30 days
  hours_back?: number = 168;

  @ApiPropertyOptional({ example: false, description: 'Return only price changes (not all snapshots)' })
  @IsOptional()
  changes_only?: boolean = false;
}

export class PriceDropQueryDto {
  @ApiProperty({ example: 'THR', description: 'Origin airport code' })
  @IsString()
  origin: string;

  @ApiProperty({ example: 'MHD', description: 'Destination airport code' })
  @IsString()
  destination: string;

  @ApiProperty({ example: ['2025-12-15', '2025-12-16'], description: 'Array of dates to check' })
  @IsString({ each: true })
  dates: string[];

  @ApiPropertyOptional({ example: 10, description: 'Minimum price drop percentage (default: 10%)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  threshold?: number = 10;
}

export class ScrapingStatsQueryDto {
  @ApiPropertyOptional({ example: 24, description: 'Hours to look back (default: 24)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  hours_back?: number = 24;
}
