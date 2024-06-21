import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Hotpoint, HotpointsResult } from '../models/hotpoint.model';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { HotpointsService } from '../hotpoints.service';
import { HistoricalMetric } from '../models/historical-metric.model';
import {
  currentHourDate,
  fillMissingRanges,
  getDateStart,
  groupRangeValues,
  isInRange,
  lastHourRange,
  makeContinousRanges,
  moveTimeRange,
  prevNthUtcDayRange,
  prevUtcDaysRange,
  todayUtcDayRange,
} from '@app/sma_common/utils';
import { HotpointStatistics } from '../models/hotpoint-statistics.model';
import { SmaGroupsService } from '@app/sma_groups';
import { SmaMessagesService } from '@app/sma_messages';
import { SmaAnalysisService } from '@app/sma_analysis';
import { AnalysisWindowStatus } from '@app/sma_analysis/enum/analysis-window-status.enum';

@Resolver(() => Hotpoint)
export class HotpointsResolver {
  constructor(
    private readonly svc: HotpointsService,
    private readonly analService: SmaAnalysisService,
  ) {}
  @Query(() => HotpointsResult)
  async hotpoints(
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('group_ids', { type: () => [String] }) target_ids: string[],
    @Args('start_from', { type: () => Date }) start_from: Date,
    @Args('end_to', { type: () => Date }) end_to: Date,
  ): Promise<HotpointsResult> {

    const windows = await this.analService.queryAnalysisWindows({
      datasource,
      group_ids: target_ids,
      time_range: {
        start_from,
        end_to,
      },
    });

    const unprocessed = windows.filter(
      (w) => w.status === AnalysisWindowStatus.CREATED,
    );

    const h = await this.svc.calculateHotpoints(
      datasource,
      target_ids,
      start_from,
      end_to,
    );

    return {
      hotpoints: h,
      totalWindows: windows.length,
      unprocessedWindows: unprocessed.length,
    };
  }

  @Query(() => [HistoricalMetric])
  async hotpointHistory(
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('group_ids', { type: () => [String] }) target_ids: string[],
    @Args('start_from', { type: () => Date }) start_from: Date,
    @Args('end_to', { type: () => Date }) end_to: Date,
    @Args('keyword') keyword: string,
    @Args('withZero', { nullable: true, defaultValue: false })
    withZero: boolean,
  ) {
    const his = await this.svc.calculateKeywordHistory(
      datasource,
      target_ids,
      start_from,
      end_to,
      keyword,
    );

    const grouped = groupRangeValues(his, 'day');

    const results = grouped.map((g) => ({
      start_from: g.start_from,
      end_to: g.end_to,
      metric: g.values.reduce((acc, v) => acc + v.count, 0),
    }));

    if (withZero) {
      const leftStartFrom = todayUtcDayRange(start_from).start_from;
      const rightEndTo = todayUtcDayRange(end_to).end_to;
      const filled = fillMissingRanges(results, {
        maxRangeDur: 24 * 3600 * 1000,
        onCreate: (range) => ({ metric: 0 }),
      });
      if (filled.length == 0) {
        return makeContinousRanges({
          startFrom: leftStartFrom,
          endTo: rightEndTo,
          maxRangeDur: 24 * 3600 * 1000,
          onCreate: (range) => ({ metric: 0 }),
        });
      } else {
        return [
          ...makeContinousRanges({
            startFrom: leftStartFrom,
            endTo: filled[0].start_from,
            maxRangeDur: 24 * 3600 * 1000,
            onCreate: (range) => ({ metric: 0 }),
          }),
          ...filled,
          ...makeContinousRanges({
            startFrom: filled[0].end_to,
            endTo: rightEndTo,
            maxRangeDur: 24 * 3600 * 1000,
            onCreate: (range) => ({ metric: 0 }),
          }),
        ];
      }
    } else {
      return results;
    }
  }

  @Query(() => HotpointStatistics)
  async hotpointStatistics(
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('group_ids', { type: () => [String] }) target_ids: string[],
    @Args('keyword') keyword: string,
    @Args('base') base: Date,
  ): Promise<HotpointStatistics> {
    // const base = new Date();
    const hourRangePairs = [
      lastHourRange(base), // curr range
      moveTimeRange(lastHourRange(base), -60 * 60 * 1000), // prev range
    ];
    const dayRangePairs = [
      prevUtcDaysRange(1, base),
      moveTimeRange(prevUtcDaysRange(1, base), -24 * 60 * 60 * 1000),
    ];
    const weerRangePairs = [
      prevUtcDaysRange(7, base),
      moveTimeRange(prevUtcDaysRange(7, base), -7 * 24 * 60 * 60 * 1000),
    ];
    const monthRangePairs = [
      prevUtcDaysRange(30, base),
      moveTimeRange(prevUtcDaysRange(30, base), -30 * 24 * 60 * 60 * 1000),
    ];

    const his = await this.svc.calculateKeywordHistory(
      datasource,
      target_ids,
      monthRangePairs[1].start_from,
      hourRangePairs[0].end_to,
      keyword,
    );

    const hourCountPairs: [number, number] = [0, 0];
    const dayCountPairs: [number, number] = [0, 0];
    const weekCountPairs: [number, number] = [0, 0];
    const monthCountPairs: [number, number] = [0, 0];

    for (const v of his) {
      for (const { range, count } of [
        { range: hourRangePairs, count: hourCountPairs },
        { range: dayRangePairs, count: dayCountPairs },
        { range: weerRangePairs, count: weekCountPairs },
        { range: monthRangePairs, count: monthCountPairs },
      ]) {
        if (isInRange(v.start_from, range[0])) {
          count[0] += v.count;
        } else if (isInRange(v.start_from, range[1])) {
          count[1] += v.count;
        }
      }
    }

    const calcInr = (pair: [number, number]) => {
      if (pair[1] === 0) {
        return null;
      }
      return (pair[0] - pair[1]) / pair[1];
    };

    return {
      hourIncr: calcInr(hourCountPairs),
      dayIncr: calcInr(dayCountPairs),
      weekIncr: calcInr(weekCountPairs),
      monthIncr: calcInr(monthCountPairs),
    };
  }

  @Query(() => [String])
  async searchKeywords(
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('group_ids', { type: () => [String] }) target_ids: string[],
    @Args('keyword') keyword: string,
    @Args('limit', { type: () => Int, defaultValue: 10, nullable: true })
    limit: number,
  ) {
    const kws = await this.svc.searchKeywords(
      datasource,
      target_ids,
      keyword,
      limit,
    );
    return kws.map((kw) => kw.name);
  }
}
