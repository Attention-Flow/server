import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MODULE_OPTIONS_TOKEN,
  SmaAnalysisModuleOptions,
} from '../sma_analysis.module-definition';
import { SmaGroupsService } from '@app/sma_groups';
import { SmaMessagesService } from '@app/sma_messages';
import { SmaAnalysisService } from './sma_analysis.service';
import { InjectModel } from '@nestjs/mongoose';
import { Summary } from '../schemas/analysis-summary.schema';
import { Model } from 'mongoose';
import { ApiKeywordsAnalysorService } from './api-keywords-analysor.service';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { Queue } from 'bull';
import { ANALYSE_RUN_QUEUE, AnalyseRunBody } from '../mq/analyse-run.mq';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class SmaSummaryService {
  private readonly logger = new Logger(SmaSummaryService.name);

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private options: SmaAnalysisModuleOptions,

    private readonly smaGroupsSvc: SmaGroupsService,
    private readonly smaMessagesSvc: SmaMessagesService,
    private readonly smaAnalyseSvc: SmaAnalysisService,

    @InjectModel(Summary.name)
    private readonly summaryModel: Model<Summary>,

    private readonly apiKeywordsAnalysorSvc: ApiKeywordsAnalysorService,

    @InjectQueue(ANALYSE_RUN_QUEUE)
    private readonly runQueue: Queue<AnalyseRunBody>,
  ) {}

  async get(args: {
    datasource: Datasource;
    keyword: string;
    start_from: Date;
    end_to: Date;
  }) {
    const { datasource, start_from, end_to, keyword } = args;
    const result = await this.summaryModel.findOne({
      datasource,
      start_from,
      end_to,
      keyword,
    });
    if (!result) {
      this.logger.log('start summary in background');
      await this.startSummaryTask({
        datasource,
        keyword,
        start_from,
        end_to,
      });
    }
    return result;
  }

  async startSummaryTask(args: {
    datasource: Datasource;
    keyword: string;
    start_from: Date;
    end_to: Date;
  }) {
    const { datasource, start_from, end_to, keyword } = args;

    const jobId = `summary-${datasource}-${keyword}-${start_from}-${end_to}`;

    this.logger.log(`jobId: ${jobId}`);
    await this.runQueue.add(
      {
        type: 'summary',
        datasource,
        keyword: keyword,
        start_from: start_from.toUTCString(),
        end_to: end_to.toUTCString(),
      },
      {
        jobId,
        removeOnComplete: true,
      },
    );
  }

  async doSummary(args: {
    datasource: Datasource;
    keyword: string;
    start_from: Date;
    end_to: Date;
  }) {
    const { datasource, start_from, end_to, keyword } = args;

    const groups = await this.smaGroupsSvc.listGroups({
      datasource,
      enable_analysor: true,
    });
    const groupIds = groups.map((g) => g.target_id);
    this.logger.debug(`keyword: ${keyword}`);
    this.logger.debug(`groupIds: ${groupIds}`);
    const msgs = await this.smaAnalyseSvc.queryRelatedMessages(
      datasource,
      groupIds,
      {
        start_from,
        end_to,
      },
      keyword,
    );
    this.logger.debug(`msgs count: ${msgs.length}`);
    if (msgs.length === 0) {
      this.logger.warn(`no messages found for keyword: ${keyword}, do nth.`);
      return;
    }
    const contents = msgs.map((msg) => msg.message);

    const result = await this.apiKeywordsAnalysorSvc.summary({
      keyword: keyword,
      contents: contents,
    });

    const existed = await this.summaryModel.findOne({
      datasource,
      start_from,
      end_to,
      keyword,
    });
    if (existed) {
      existed.summary = result.summary;
      return await existed.save();
    } else {
      return await this.summaryModel.create({
        datasource,
        start_from,
        end_to,
        keyword,
        summary: result.summary,
      });
    }
  }
}
