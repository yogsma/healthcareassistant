import { Module } from '@nestjs/common';
import { DBAccessService } from './db-access.service';


@Module({
  providers: [DBAccessService],
  exports: [DBAccessService],
})
export class DBAccessModule {}