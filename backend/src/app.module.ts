import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MulterModule } from '@nestjs/platform-express';
import { DBAccessModule } from 'libs/src';
import { BullModule } from '@nestjs/bullmq';
import { FileProcessingService } from './file-processing.service';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    ConfigModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [AppService, FileProcessingService, ChatService],
})
export class AppModule {}
