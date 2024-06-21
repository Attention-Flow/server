import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { AnalysisWindow } from '../models/analysis-window.model';
import { SmaAnalysisService } from '../services/sma_analysis.service';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { TimeRange } from '@app/sma_common/models/time-range.model';
import { Message } from '@app/sma_messages/models/message.model';
import { SmaMessagesService } from '@app/sma_messages';
import { AnalysisWindowStatus } from '../enum/analysis-window-status.enum';

@Resolver(() => AnalysisWindow)
export class AnalysisWindowsResolver {
  constructor(
    private readonly svc: SmaAnalysisService,
    private readonly messageSvc: SmaMessagesService,
  ) {}

  @ResolveField(() => Number)
  async messageCount(@Parent() window: AnalysisWindow) {
    const impl = this.messageSvc.getDatasourceImpl(window.datasource);
    return await impl.countMessages(window.target_id, {
      start_from: window.start_from,
      end_to: window.end_to,
    });
  }

  @Query(() => [AnalysisWindow])
  async analysisWindowAt(
    @Args('start_from', { type: () => Date }) start_from: Date,
    @Args('end_to', { type: () => Date }) end_to: Date,
  ) {
    return await this.svc.queryAnalysisWindows({
      time_range: {
        start_from,
        end_to,
      },
    });
  }

  @Query(() => [AnalysisWindow])
  async analysisWindow(
    @Args('datasource', { type: () => Datasource, nullable: true })
    datasource?: Datasource,
    @Args('target_ids', { type: () => [String], nullable: true })
    target_ids?: string[],
    @Args('status', { type: () => AnalysisWindowStatus, nullable: true })
    status?: AnalysisWindowStatus,
    @Args('start_from', { type: () => Date, nullable: true }) start_from?: Date,
    @Args('end_to', { type: () => Date, nullable: true }) end_to?: Date,
  ) {
    return await this.svc.queryAnalysisWindows({
      datasource: datasource,
      status,
      group_ids: target_ids,
      time_range:
        start_from && end_to
          ? {
              start_from,
              end_to,
            }
          : undefined,
    });
  }

  @Mutation(() => String)
  async analysis(
    @Args('datasource', { type: () => Datasource })
    datasource: Datasource,
    @Args('target_ids', { type: () => [String] })
    target_ids: string[],
    @Args('start_from', { type: () => Date }) start_from: Date,
    @Args('end_to', { type: () => Date }) end_to: Date,
  ) {
    const widows = await this.svc.queryAnalysisWindows({
      datasource,
      group_ids: target_ids,
      time_range: {
        start_from,
        end_to,
      },
    });

    for (const window of widows) {
      await this.svc.analyseAnalysisWindow(window);
    }
    return 'ok';
  }

  @Query(() => TimeRange)
  async analysedTimeRange(
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('target_id', { type: () => String }) target_id: string,
  ) {
    return await this.svc.queryTotalAnalysedTimeRange(datasource, target_id);
  }

  @Query(() => [Message])
  async relatedMessages(
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('target_ids', { type: () => [String] }) target_ids: string[],
    @Args('start_from', { type: () => Date }) start_from: Date,
    @Args('end_to', { type: () => Date }) end_to: Date,
    @Args('keyword', { type: () => String }) keyword: string,
  ) {
    return await this.svc.queryRelatedMessages(
      datasource,
      target_ids,
      {
        start_from,
        end_to,
      },
      keyword,
    );
  }
}
