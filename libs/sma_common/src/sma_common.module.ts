import { Module } from '@nestjs/common';
import { SmaCommonService } from './sma_common.service';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [SmaCommonService],
  exports: [SmaCommonService],
})
export class SmaCommonModule {}
