import { Global, Module } from '@nestjs/common';
import { SmaMessagesService } from './sma_messages.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TelegramMessage,
  TelegramMessageSchema,
} from './schemas/telegram-message.schema';
import { LensMessage, LensMessageSchema } from './schemas/lens-message.schema';
import { LensDatasourceService } from './services/lens-datasource.service';
import { TelegramDatasourceService } from './services/telegram-datasource.service';
import { RangeCount, RangeCountSchema } from './schemas/range-count.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TelegramMessage.name, schema: TelegramMessageSchema },
      { name: LensMessage.name, schema: LensMessageSchema },
      { name: RangeCount.name, schema: RangeCountSchema },
    ]),
  ],
  providers: [
    SmaMessagesService,
    LensDatasourceService,
    TelegramDatasourceService,
  ],
  exports: [SmaMessagesService],
})
export class SmaMessagesModule {}
