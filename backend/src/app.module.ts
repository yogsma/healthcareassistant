import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DBAccessModule } from 'libs/src';
import { BullModule } from '@nestjs/bullmq';
import { FileProcessingService } from './file-processing.service';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    DBAccessModule,
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'file-processing',
    }),
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60000, limit: 60 }]),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    FileProcessingService,
    ChatService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    },
  ],
})
export class AppModule {}
