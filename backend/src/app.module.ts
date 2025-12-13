import { Module } from '@nestjs/common';
import { PluginModule } from './core/plugin.module';
import { DatabaseModule } from './core/database/database.module';
import { PostgresModule } from './core/database/postgres.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mongodbConfig from './config/mongodb.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Airline } from './modules/airline/models/airline.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'assets'),
      serveRoot: '/assets',
    }),
    EventEmitterModule.forRoot(),
    // ConfigModule.forRoot({ isGlobal: true, }),
    DatabaseModule, // This module already configures TypeORM with all entities
    PostgresModule, // PostgreSQL for flight tracking database
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        ttl: 60, // زمان کش به ثانیه (مثلاً ۶۰ ثانیه)
      }),
    }),

    // CacheModule.register({
    //   isGlobal: true,
    //   ttl: 60 * 60000,
    // }),
    // MulterModule.register({
    //   storage: memoryStorage()
    // }),
    // ThrottlerModule.forRoot({
    //   ttl: 60,
    //   limit: 10,
    // }),
    ConfigModule.forRoot({
      load: [mongodbConfig],
      isGlobal: true,
    }),
    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //   //   useCreateIndex: true,
    //   //   useNewUrlParser: true,
    //   //   useUnifiedTopology: true,
    //     uri: configService.get<string>('mongodb.uri'),
    //   }),
    //   inject: [ConfigService],
    // }),
    PluginModule.registerPluginsAsync(),
    MongooseModule.forRoot(
      'mongodb://root:wjGXBeFzCtlDJASgZtAgw949@chogolisa.liara.cloud:33604/my-app?authSource=admin&replicaSet=rs0&directConnection=true',
    ),

    // BullModule.forRoot({
    //   redis: {
    //     host: process.env.REDIS_HOST,
    //     port: Number(process.env.REDIS_PORT),
    //   },
    // }),
  ],
  providers: [
    //   {
    //     provide: APP_INTERCEPTOR,
    //     useClass: CacheInterceptor,
    //   },
  ],
})
export class AppModule {}
