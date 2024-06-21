import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnalysisWindow,
  AnalysisWindowDocument,
} from '../schemas/analysis-window.schema';
import { AnalysisWindowStatus } from '../enum/analysis-window-status.enum';
import { KeywordsAnalysor } from '../interfaces/keywords-analysor';
import { ApiKeywordsAnalysorService } from './api-keywords-analysor.service';
import {
  MODULE_OPTIONS_TOKEN,
  SmaAnalysisModuleOptions,
} from '../sma_analysis.module-definition';
import { SmaGroupsService } from '@app/sma_groups';
import { SmaMessagesService } from '@app/sma_messages';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { TimeRange } from '@app/sma_common/dto/time-range.dto';
import { getDayDuration } from '@app/sma_common/utils';
import { DateTime } from 'luxon';
import { InjectQueue } from '@nestjs/bull';
import { ANALYSE_RUN_QUEUE, AnalyseRunBody } from '../mq/analyse-run.mq';
import { Queue } from 'bull';

@Injectable()
export class SmaAnalysisService {
  private readonly logger = new Logger(SmaAnalysisService.name);

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private options: SmaAnalysisModuleOptions,

    private readonly smaGroupsSvc: SmaGroupsService,
    private readonly smaMessagesSvc: SmaMessagesService,

    @InjectModel(AnalysisWindow.name)
    private readonly analysisWindowModel: Model<AnalysisWindow>,

    private readonly apiKeywordsAnalysorSvc: ApiKeywordsAnalysorService,

    @InjectQueue(ANALYSE_RUN_QUEUE)
    private readonly runQueue: Queue<AnalyseRunBody>,
  ) {}

  async loopProcessAllTargetGroups(interval = 1000 * 3600 * 1) {
    while (true) {
      try {
        const targets = await this.smaGroupsSvc.listGroups({
          enable_analysor: true,
        });

        for (const { datasource, target_id } of targets) {
          await this.processTargetGroup(datasource, target_id);
        }
      } catch (err) {
        this.logger.error(err);
        this.logger.error(err.stack);
      }
      this.logger.log(
        `next analysis run  after ${(interval / 1000 / 3600).toFixed(2)} hours`,
      );
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  async processTargetGroup(datasource: Datasource, group_id: string) {
    
    await this.ensureAnalysisWindowCreated(datasource, group_id);

    
    // const unprocessedWindows = await this.listUnprocessedAnalysisWindows(
    //   datasource,
    //   group_id,
    // );
    // if (unprocessedWindows.length === 0) {
    //   this.logger.log(`[${datasource}][${group_id}] no unprocessed windows.`);
    //   return;
    // }

    // this.logger.log(
    //   `[${datasource}][${group_id}] there is ${unprocessedWindows.length} unprocessed windows.`,
    // );

    // let processed = 0;
    // for (const win of unprocessedWindows) {
    //   this.logger.verbose(
    //     `processing ${processed + 1}/${unprocessedWindows.length}`,
    //   );
    //   // await this.analyseAnalysisWindow(win);
    //   processed += 1;
    // }
  }

  private getMessagesService(datasource: Datasource) {
    return this.smaMessagesSvc.getDatasourceImpl(datasource);
  }

  private getKeywordsAnalysor(): KeywordsAnalysor {
    // return {
    //   analyse: async () => ({
    //     keywords: [],
    //   }),
    // };
    return this.apiKeywordsAnalysorSvc;
  }

  
  async ensureAnalysisWindowCreated(datasource: Datasource, group_id: string) {
    this.logger.log(
      `[${datasource}][${group_id}] ensure analysis windows created`,
    );
    const dsSvc = this.getMessagesService(datasource);
  
    const msgsRange = await dsSvc.queryGroupMessagesTimeRange(group_id);
    // console.log(msgsRange);
  
    const winCreatedTimeRanges = await this.queryExistedAnalysisWindowTimeRange(
      datasource,
      group_id,
    );

  
    const newWins: TimeRange[] = [];

    let { start: startFrom } = getDayDuration(msgsRange.start_from); 
    let currCreatedTimeRangeIdx = 0;

    while (
      DateTime.fromJSDate(startFrom).plus({ days: 1 }).toJSDate().getTime() <
      msgsRange.end_to.getTime()
    ) {
      if (currCreatedTimeRangeIdx < winCreatedTimeRanges.length) {
        const createdTimeRange = winCreatedTimeRanges[currCreatedTimeRangeIdx];
        if (
          startFrom.getTime() >= createdTimeRange.start_from.getTime() &&
          startFrom.getTime() < createdTimeRange.end_to.getTime()
        ) {
          startFrom = createdTimeRange.end_to;
          currCreatedTimeRangeIdx++;
          continue;
        }
      }


      const endTo = DateTime.fromJSDate(startFrom).plus({ days: 1 }).toJSDate();
      newWins.push({
        start_from: startFrom,
        end_to: endTo,
      });
      startFrom = endTo;
    }

    if (newWins.length > 0) {
      this.logger.log(
        `[${datasource}][${group_id}] will create ${newWins.length} windows`,
      );
      await this.analysisWindowModel.insertMany(
        newWins.map(
          (range) =>
            new this.analysisWindowModel({
              datasource: datasource,
              target_id: group_id,
              start_from: range.start_from,
              end_to: range.end_to,
              duration: Math.floor(
                (range.end_to.getTime() - range.start_from.getTime()) / 1000,
              ),
            }),
        ),
      );
    } else {
      this.logger.log(`[${datasource}][${group_id}] no new windows to create`);
    }
  }

  async listUnprocessedAnalysisWindows(
    datasource: Datasource,
    group_id: string,
  ) {
    return this.analysisWindowModel
      .find({
        datasource: datasource,
        target_id: group_id,
        status: AnalysisWindowStatus.CREATED,
      })
      .exec();
  }

  async getAnalyseWindowById(id: string) {
    return await this.analysisWindowModel.findById(id);
  }


  async analyseAnalysisWindow(win: AnalysisWindowDocument) {
    this.logger.verbose(
      `analyse window '${win.datasource}' '${win.target_id}' ${formatTimeRange(
        win,
      )}`,
    );
    if (win.status !== AnalysisWindowStatus.CREATED) {
      return;
    }
    const group = await this.smaGroupsSvc.getGroup(
      win.datasource,
      win.target_id,
    );

    if (!group) {
      this.logger.error(`group ${win.target_id} not found, process nothing.`);
      return;
    }

    const dsSvc = this.getMessagesService(win.datasource);
    const messages = await dsSvc.listMessagesInRange(win.target_id, {
      start_from: win.start_from,
      end_to: win.end_to,
    });

    if (messages.length > 0) {
      this.logger.verbose(`analyse ${messages.length} messages`);
      const analysor = this.getKeywordsAnalysor();
      const result = await analysor.analyse({
        datasource: group.datasource,
        group_id: group.target_id,
        group_type: group.content_type,
        messages,
      });
      this.logger.verbose(
        `analyse result: ${JSON.stringify(result.keywords.length)} keywords`,
      );
      win.keywords = result.keywords;
    }
    win.messages = messages.length;
    win.status = AnalysisWindowStatus.ANALYSED;
    await win.save();
  }

  
  async queryExistedAnalysisWindowTimeRange(
    datasource: Datasource,
    group_id: string,
  ): Promise<TimeRange[]> {
  

  
    const windows = await this.analysisWindowModel
      .find(
        {
          datasource: datasource,
          target_id: group_id,
        },
        {
          start_from: 1,
          end_to: 1,
        },
      )
      .sort({ start_from: 1 })
      .exec();

    if (windows.length === 0) {
      return [];
    } else if (windows.length === 1) {
      return windows;
    }
    const ranges: TimeRange[] = [];

    let currRange = windows[0];
    for (let idx = 1; idx < windows.length; idx++) {
      

      const win = windows[idx];

      if (win.start_from.getTime() !== currRange.end_to.getTime()) {
        ranges.push(currRange);
        currRange = win;
      } else {
        currRange.end_to = win.end_to;
      }
    }
    ranges.push(currRange);
    return ranges;
  }

  
  async queryAnalysisWindows(args: {
    datasource?: Datasource;
    group_ids?: string[];
    time_range?: TimeRange;
    status?: AnalysisWindowStatus;
  }) {
    const { datasource, group_ids, time_range, status } = args;

    // const params = {
    //   datasource: datasource,
    //   status: AnalysisWindowStatus.ANALYSED,
    //   target_id: group_ids
    //     ? {
    //         $in: group_ids,
    //       }
    //     : undefined,
    //   start_from: {
    //     $gte: time_range.start_from,
    //     $lt: time_range.end_to,
    //   },
    //   end_to: {
    //     $gt: time_range.start_from,
    //     $lte: time_range.end_to,
    //   },
    // };

    // const params: any = {};
    // if (group_ids !== undefined) {
    //   params.target_id = {
    //     $in: group_ids,
    //   };
    // }
    // if (datasource !== undefined) {
    //   params.datasource = datasource;
    // }
    // if (time_range !== undefined) {
    //   params.start_from = {
    //     $gte: time_range.start_from,
    //     $lt: time_range.end_to,
    //   };
    //   params.end_to = {
    //     $gt: time_range.start_from,
    //     $lte: time_range.end_to,
    //   };
    // }
    const params: any = {
      // datasource: datasource,
      // status: status,
      // target_id: group_ids
      //   ? {
      //       $in: group_ids,
      //     }
      //   : undefined,
      // start_from: {
      //   $gte: time_range.start_from,
      //   $lt: time_range.end_to,
      // },
      // end_to: {
      //   $gt: time_range.start_from,
      //   $lte: time_range.end_to,
      // },
    };
    if (group_ids !== undefined) {
      params.target_id = {
        $in: group_ids,
      };
    }
    if (datasource !== undefined) {
      params.datasource = datasource;
    }
    if (status !== undefined) {
      params.status = status;
    }
    if (time_range !== undefined) {
      params.start_from = {
        $gte: time_range.start_from,
        $lt: time_range.end_to,
      };
      params.end_to = {
        $gt: time_range.start_from,
        $lte: time_range.end_to,
      };
    }
    // console.log(params);
    return await this.analysisWindowModel.find(params);
  }

  
  async queryTotalAnalysedTimeRange(
    datasource: Datasource,
    group_id: string,
  ): Promise<TimeRange | null> {
    const earlist = await this.analysisWindowModel
      .findOne({
        datasource: datasource,
        target_id: group_id,
        status: AnalysisWindowStatus.ANALYSED,
      })
      .sort({ start_from: 1 });
    const latest = await this.analysisWindowModel
      .findOne({
        datasource: datasource,
        target_id: group_id,
        status: AnalysisWindowStatus.ANALYSED,
      })
      .sort({ end_to: -1 });
    if (earlist && latest) {
      return {
        start_from: earlist.start_from,
        end_to: latest.end_to,
      };
    }
    return null;
  }

  
  async queryRelatedMessages(
    datasource: Datasource,
    group_ids: string[],
    time_range: TimeRange,
    keyword: string,
  ) {
    const matchParams = {
      datasource: datasource,
      target_id: {
        $in: group_ids,
      },
      start_from: {
        $gte: time_range.start_from,
        $lt: time_range.end_to,
      },
      end_to: {
        $gt: time_range.start_from,
        $lte: time_range.end_to,
      },
      status: AnalysisWindowStatus.ANALYSED,
      'keywords.name': keyword,
    };
    this.logger.verbose(JSON.stringify(matchParams));
    const msg_ids_arr = await this.analysisWindowModel
      .aggregate()
      .match(matchParams)
      .unwind({
        path: '$keywords',
        preserveNullAndEmptyArrays: false,
      })
      .match({
        'keywords.name': keyword,
      })
      .project({
        msg_ids: '$keywords.msg_ids',
      })
      .exec();

    const msg_ids = msg_ids_arr.flatMap((item) => item.msg_ids);
    this.logger.debug(
      `${msg_ids.length} msg ids, ${msg_ids.slice(0, 2).join(', ')} ...`,
    );
    const svc = this.getMessagesService(datasource);
    const msgs = await svc.queryMessagesById(msg_ids);

    return msgs.filter((msg) => !!msg);
  }

  async queryKeywordIncludedWindows(
    datasource: Datasource,
    group_ids: string[],
    time_range: TimeRange,
    keyword: string,
  ) {
    const keyword_wins = await this.analysisWindowModel.find({
      datasource: datasource,
      target_id: {
        $in: group_ids,
      },
      start_from: {
        $gte: time_range.start_from,
        $lt: time_range.end_to,
      },
      end_to: {
        $gt: time_range.start_from,
        $lte: time_range.end_to,
      },
      status: AnalysisWindowStatus.ANALYSED,
      'keywords.name': keyword,
    });
    return keyword_wins;
  }

  async queryTotalKeywords(
    datasource: Datasource,
    group_ids?: string[],
  ): Promise<{ name: string; count: number }[]> {
    const cond = {
      datasource: datasource,
    };
    if (group_ids) {
      cond['target_id'] = {
        $in: group_ids,
      };
    }
    const keywords = await this.analysisWindowModel.aggregate([
      {
        $match: cond,
      },
      {
        $unwind: {
          path: '$keywords',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: '$keywords.name',
          count: { $sum: 1 },
        },
      },
    ]);

    return keywords.map((item) => ({
      name: item._id,
      count: item.count,
    }));
  }

  async startKeywordsTask(
    datasource: Datasource,
    group_id: string,
    windows_id: string,
  ) {
    const jobId = `keywords-${datasource}-${windows_id}`;

    this.logger.log(`jobId: ${jobId}`);
    await this.runQueue.add(
      {
        type: 'keywords',
        datasource,
        window_id: windows_id,
      },
      {
        jobId,
        removeOnComplete: true,
      },
    );
  }

  
  // async searchKeywords({
  //   datasource,
  //   group_ids,
  //   time_range,
  //   keyword,
  //   limit = 10,
  // }: {
  //   datasource?: Datasource;
  //   group_ids?: string[];
  //   time_range?: TimeRange;
  //   keyword: string;
  //   limit?: number;
  // }) {
  

  //   const cond = {
  //     'keywords.name': { $regex: '.*' + keyword + '.*' },
  //   };
  //   if (datasource) {
  //     cond['datasource'] = datasource;
  //   }
  //   if (group_ids) {
  //     cond['target_id'] = { $in: group_ids };
  //   }
  //   if (time_range) {
  //     cond['start_from'] = {
  //       $gte: time_range.start_from,
  //       $lt: time_range.end_to,
  //     };
  //     cond['end_to'] = {
  //       $gt: time_range.start_from,
  //       $lte: time_range.end_to,
  //     };
  //   }

  //   const names = await this.analysisWindowModel
  //     .aggregate([
  //       {
  //         $match: cond,
  //       },
  //       {
  //         $unwind: {
  //           path: '$keywords',
  //           preserveNullAndEmptyArrays: false,
  //         },
  //       },
  //       {
  //         $match: {
  //           'keywords.name': { $regex: '.*' + keyword + '.*' },
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: '$keywords.name',
  //           uniqueValues: { $addToSet: '$fieldName' },
  //         },
  //       },
  //       {
  //         $project: {
  //           name: '$_id',
  //           regex_match: {
  //             $eq: [
  //               keyword.toLowerCase(),
  //               {
  //                 $substr: [{ $toLower: '$_id' }, 0, keyword.length],
  //               },
  //             ],
  //           },
  //         },
  //       },
  //       {
  //         $sort: {
  //           regex_match: -1,
  //         },
  //       },
  //     ])
  //     .limit(limit)
  //     .exec();

  //   return names.map((item) => item.name);
  // }
}

// Utils


function makeMinSecMsZeroCeil(date: Date) {
  const d = new Date(date.getTime());
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  if (
    date.getSeconds() !== 0 ||
    date.getMilliseconds() !== 0 ||
    date.getMinutes() !== 0
  ) {
    d.setHours(date.getHours() + 1);
  }

  return d;
}


function makeHourMinSecMsZeroCeil(date: Date) {
  const d = new Date(date.getTime());
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  // if (
  //   date.getSeconds() !== 0 ||
  //   date.getMilliseconds() !== 0 ||
  //   date.getMinutes() !== 0
  // ) {
  //   d.setHours(date.getHours() + 1);
  // }

  return d;
}

function formatTimeRange(range: TimeRange) {
  // format YYYY-mm-dd HH:MM:SS
  function fmt(d: Date) {
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    const sec = d.getSeconds().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day} ${hour}:${min}:${sec}`;
  }

  return `['${fmt(range.start_from)}', '${fmt(range.end_to)}')`;
}
