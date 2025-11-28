import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthenticatedSocketAdapter } from './core/sockets/authenticated-socket.adapter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  const config = new DocumentBuilder()
    .setTitle('Travel Bot API')
    .setDescription('API for interacting with the Travel Bot')
    .setVersion('1.0')
    .addTag('chat')
    .addTag('flights')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useWebSocketAdapter(new AuthenticatedSocketAdapter(app));
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on:${port}`);
}
bootstrap();
