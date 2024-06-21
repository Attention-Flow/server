import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ANALYSE_RESULT_QUEUE, AnalyseResultBody } from './ananlyse-result.mq';
import { SmaAnalysisService } from '../services/sma_analysis.service';
import { SmaSummaryService } from '../services/sma_summary.service';

@Processor(ANALYSE_RESULT_QUEUE)
export class AnalyseConsumer {
  constructor(
    private readonly service: SmaAnalysisService,
    private readonly summaryService: SmaSummaryService,
  ) {}

  @Process()
  async process(job: Job<AnalyseResultBody>) {}
}
