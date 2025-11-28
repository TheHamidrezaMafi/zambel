import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { grpcScraperClientOptions } from './client/scraper.client';
import { ScraperService } from './services/scraper.service';
import { ScraperController } from './controllers/scraper.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SCRAPER_PACKAGE',
        ...grpcScraperClientOptions,
      },
    ]),
  ],
  providers: [ScraperService],
  controllers: [ScraperController],
  exports: [ScraperService],
})
export class ScraperModule {}
