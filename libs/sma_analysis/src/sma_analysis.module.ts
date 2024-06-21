import { Global, Module } from '@nestjs/common';
import { SmaAnalysisService } from './services/sma_analysis.service';

import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';

import {
  AnalysisWindow,
  AnalysisWindowSchema,
} from './schemas/analysis-window.schema';
import { ApiKeywordsAnalysorService } from './services/api-keywords-analysor.service';
import { AnalysisWindowsResolver } from './resolvers/analysis-windows.resolver';
import { ConfigurableModuleClass } from './sma_analysis.module-definition';
import { SmaGroupsModule } from '@app/sma_groups';
import { DateScalar } from './scarlars/date.scarlar';
import { SmaMessagesModule } from '@app/sma_messages';
import { Summary, SummarySchema } from './schemas/analysis-summary.schema';
import { SmaSummaryService } from './services/sma_summary.service';
import { KeywordSummaryResolver } from './resolvers/keyword-summary.resovler';
import { AnalyseRunConsumer } from './mq/analyse-run.consumer';
import { BullModule } from '@nestjs/bull';
import { ANALYSE_RUN_QUEUE } from './mq/analyse-run.mq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Global()
@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: AnalysisWindow.name, schema: AnalysisWindowSchema },
      { name: Summary.name, schema: SummarySchema },
    ]),
    BullModule.registerQueue({
      name: ANALYSE_RUN_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: ANALYSE_RUN_QUEUE,
      adapter: BullMQAdapter, //or use Bul
    }),
    SmaGroupsModule,
    SmaMessagesModule,
  ],
  providers: [
    SmaAnalysisService,
    ApiKeywordsAnalysorService,
    AnalysisWindowsResolver,
    SmaSummaryService,
    KeywordSummaryResolver,

    AnalyseRunConsumer,

    DateScalar,
  ],
  exports: [SmaAnalysisService],
})
export class SmaAnalysisModule extends ConfigurableModuleClass {}
