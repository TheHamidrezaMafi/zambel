import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScraperHttpService } from './services/scraper-http.service';
import { ScraperController } from './controllers/scraper.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120000,
      maxRedirects: 5,
    }),
  ],
  providers: [ScraperHttpService],
  controllers: [ScraperController],
  exports: [ScraperHttpService],
})
export class ScraperModule {}
