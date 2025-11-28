import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Airline } from './models/airline.entity';
import { AirlineController } from './controllers/airline.controller';
import { AirlineService } from './services/airline.service';

@Module({
  imports: [TypeOrmModule.forFeature([Airline])],
  controllers: [AirlineController],
  providers: [AirlineService],
  exports: [AirlineService],
})
export class AirlineModule {}
