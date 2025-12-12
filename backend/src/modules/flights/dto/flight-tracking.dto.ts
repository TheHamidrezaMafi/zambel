import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class FlightPriceHistoryDto {
  @ApiProperty({ description: 'شناسه منحصر به فرد' })
  id: string;

  @ApiProperty({ description: 'نام ارائه دهنده', example: 'alibaba' })
  provider: string;

  @ApiProperty({ description: 'قیمت بزرگسال', example: 5000000 })
  adult_price: number;

  @ApiPropertyOptional({ description: 'قیمت کودک', example: 2500000 })
  child_price?: number;

  @ApiPropertyOptional({ description: 'تعداد صندلی موجود', example: 15 })
  available_seats?: number;

  @ApiProperty({ description: 'زمان جمع‌آوری اطلاعات' })
  scraped_at: Date;

  @ApiPropertyOptional({ description: 'درصد تغییر قیمت', example: -5.5 })
  price_change_percentage?: number;

  @ApiPropertyOptional({ description: 'مبلغ تغییر قیمت', example: -275000 })
  price_change_amount?: number;
}

export class TrackedFlightDto {
  @ApiProperty({ description: 'شناسه منحصر به فرد' })
  id: string;

  @ApiProperty({ description: 'شماره پرواز', example: 'IR263' })
  flight_number: string;

  @ApiProperty({ description: 'تاریخ پرواز', example: '2025-01-15' })
  flight_date: Date;

  @ApiProperty({ description: 'مبدا', example: 'THR' })
  origin: string;

  @ApiProperty({ description: 'مقصد', example: 'MHD' })
  destination: string;

  @ApiPropertyOptional({ description: 'نام فارسی ایرلاین', example: 'ایران ایر' })
  airline_name_fa?: string;

  @ApiPropertyOptional({ description: 'زمان حرکت' })
  departure_time?: Date;

  @ApiPropertyOptional({ description: 'زمان رسیدن' })
  arrival_time?: Date;

  @ApiProperty({ description: 'تاریخ ایجاد' })
  created_at: Date;

  @ApiPropertyOptional({ description: 'آخرین زمان بررسی قیمت' })
  last_tracked_at?: Date;

  @ApiPropertyOptional({ description: 'تاریخچه قیمت‌ها', type: [FlightPriceHistoryDto] })
  price_history?: FlightPriceHistoryDto[];
}

export class FlightPriceQueryDto {
  @ApiPropertyOptional({ description: 'مبدا', example: 'THR' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ description: 'مقصد', example: 'MHD' })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({ description: 'تاریخ شروع', example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'تاریخ پایان', example: '2025-01-20' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'شماره پرواز', example: 'IR263' })
  @IsOptional()
  @IsString()
  flight_number?: string;

  @ApiPropertyOptional({ description: 'نام ارائه دهنده', example: 'alibaba' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'حداقل قیمت', example: 1000000 })
  @IsOptional()
  @IsNumber()
  min_price?: number;

  @ApiPropertyOptional({ description: 'حداکثر قیمت', example: 10000000 })
  @IsOptional()
  @IsNumber()
  max_price?: number;

  @ApiPropertyOptional({ description: 'تعداد رکورد در صفحه', example: 50, default: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'شماره صفحه', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;
}

export class PriceStatisticsDto {
  @ApiProperty({ description: 'کمترین قیمت' })
  min_price: number;

  @ApiProperty({ description: 'بیشترین قیمت' })
  max_price: number;

  @ApiProperty({ description: 'میانگین قیمت' })
  avg_price: number;

  @ApiProperty({ description: 'قیمت فعلی' })
  current_price: number;

  @ApiProperty({ description: 'تعداد تغییرات قیمت' })
  price_changes_count: number;

  @ApiProperty({ description: 'درصد تغییر از اولین قیمت' })
  total_price_change_percentage: number;
}

export class RouteConfigDto {
  @ApiProperty({ description: 'مبدا', example: 'THR' })
  @IsString()
  origin: string;

  @ApiProperty({ description: 'مقصد', example: 'MHD' })
  @IsString()
  destination: string;

  @ApiPropertyOptional({ description: 'نام فارسی مبدا', example: 'تهران' })
  @IsOptional()
  @IsString()
  origin_name_fa?: string;

  @ApiPropertyOptional({ description: 'نام فارسی مقصد', example: 'مشهد' })
  @IsOptional()
  @IsString()
  destination_name_fa?: string;

  @ApiPropertyOptional({ description: 'فعال/غیرفعال', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'تعداد روز جلو', example: 7, default: 7 })
  @IsOptional()
  @IsNumber()
  days_ahead?: number;

  @ApiPropertyOptional({ description: 'فاصله زمانی بررسی (دقیقه)', example: 60, default: 60 })
  @IsOptional()
  @IsNumber()
  tracking_interval_minutes?: number;

  @ApiPropertyOptional({ description: 'ارائه دهندگان مورد نظر', example: ['alibaba', 'safar366'] })
  @IsOptional()
  @IsArray()
  preferred_providers?: string[];
}
