import { Module } from '@nestjs/common';
import { FileProcessingConsumer } from './file-processing.consumer';
import { DBAccessModule } from 'libs/src';


@Module({
  imports: [
    DBAccessModule,
  ],
  providers: [FileProcessingConsumer],
  exports: [FileProcessingConsumer],
})
export class BullQueueConsumerModule {}