import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsNumber, IsOptional } from "class-validator"


export class FlightSearchDTO{

    @ApiProperty({ description: 'مبدا سفر', example: 'THR' })
    @IsNotEmpty()
    origin: string;
  
    @ApiProperty({ description: 'مقصد سفر', example: 'MSH' })
    @IsNotEmpty()
    destination: string;
  
    @ApiProperty({ description: 'تاریخ شروع سفر', example: '2025-01-25' })
    @IsNotEmpty()
    @IsDateString()
    start_date: Date;
  
    @ApiPropertyOptional({ description: 'تاریخ بازگشت', example: '2025-01-28' })
    @IsOptional()
    @IsDateString()
    return_date?: Date;
  
    @ApiProperty({ description: 'تعداد بزرگسالان', example: 2 })
    @IsNotEmpty()
    @IsNumber()
    adult: number;
  
    @ApiPropertyOptional({ description: 'تعداد کودکان', example: 1 })
    @IsOptional()
    @IsNumber()
    children?: number;

    @ApiPropertyOptional({ description: 'کد یونیک هر درخواست', example: '' })
    @IsOptional()
    uuid?: string;
}
