import { Process, Processor } from '@nestjs/bull';
import { ANALYSE_RUN_QUEUE, AnalyseRunBody } from './analyse-run.mq';
import { Job } from 'bull';
import { SmaSummaryService } from '../services/sma_summary.service';
import { SmaAnalysisService } from '../services/sma_analysis.service';
import { Logger } from '@nestjs/common';

@Processor(ANALYSE_RUN_QUEUE)
export class AnalyseRunConsumer {
  private readonly logger = new Logger(AnalyseRunConsumer.name);

  constructor(
    private readonly summaryService: SmaSummaryService,
    private readonly keywordService: SmaAnalysisService,
  ) {}

  @Process()
  async process(job: Job<AnalyseRunBody>) {
    const data = job.data;
    switch (data.type) {
      case 'summary': {
        await this.summaryService.doSummary({
          datasource: data.datasource,
          keyword: data.keyword,
          start_from: new Date(data.start_from),
          end_to: new Date(data.end_to),
        });
        break;
      }
      case 'keywords': {
        this.logger.log('run keywords job');
        const win = await this.keywordService.getAnalyseWindowById(
          data.window_id,
        );
        await this.keywordService.analyseAnalysisWindow(win);
        break;
      }
      default: {
        throw new Error('unkown');
      }
    }
  }
}
