import { InjectModel } from '@nestjs/mongoose';
import { MessageDTO } from '../dto/message.dto';
import { DatasourceService } from '../interfaces/datasource-service';
import { LensMessage } from '../schemas/lens-message.schema';
import { Model } from 'mongoose';
import { TimeRange } from '@app/sma_common/models/time-range.model';
import { count } from 'console';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LensDatasourceService implements DatasourceService {
  
  private readonly logger = new Logger(LensDatasourceService.name);

  constructor(
    @InjectModel(LensMessage.name)
    private readonly messageModel: Model<LensMessage>,

    
  ) {}

  // makePostProcessedFilter() {
  //   return {
  //     metadata_fetched: true,
  //     block_timestamp: {
  //       $type: 'date',
  //     },
  //   };
  // }

  async queryGroupMessagesTimeRange(group_id: string): Promise<TimeRange> {
    const conditions = makeMessagesFilter({
      group_id,
    });
    const latest = await this.messageModel
      .findOne(conditions)
      .sort({
        block_timestamp: -1,
      })
      .exec();
    const earliest = await this.messageModel
      .findOne(conditions)
      .sort({
        block_timestamp: 1,
      })
      .exec();

    if (!earliest || !latest) {
      return {
        start_from: new Date(0),
        end_to: new Date(0),
      };
    }

    return {
      start_from: earliest.block_timestamp,
      end_to: latest.block_timestamp,
    };
  }

  async listMessagesInRange(
    group_id: string,
    range: TimeRange,
  ): Promise<MessageDTO[]> {
    const cond = makeMessagesFilter({
      timeRange: range,
      group_id,
    });

    // console.log(cond);
    const msgs = await this.messageModel
      .find(cond, {
        _id: 0,
        post_id: 1,
        block_timestamp: 1,
        'metadata.content': 1,
        profile_id: 1,
      })
      .sort({ date: 1 })
      .exec();

    return msgs.map((msg) => this.toMessageDTO(msg));
  }

  async queryMessagesById(ids: string[]): Promise<MessageDTO[]> {
    const msgs = await this.messageModel.find({
      post_id: {
        $in: ids,
      },
    });

    const idMsgMap = new Map<string, MessageDTO>();
    msgs.forEach((msg) => {
      const dto = this.toMessageDTO(msg);
      idMsgMap.set(dto.msg_id, dto);
    });
    return ids.map((id) => idMsgMap.get(id) || null);
  }

  toMessageDTO(msg: LensMessage): MessageDTO {
    return {
      msg_id: msg.post_id,
      from_id: msg.profile_id,
      group_id: msg.app_id,
      message: msg.metadata.content,
      date: Math.ceil(msg.block_timestamp.getTime() / 1000),
    };
  }

  async countMessagesByHours(
    group_id: string,
    range: TimeRange,
  ): Promise<{ hour: Date; count: number }[]> {
    const cond = makeMessagesFilter({
      timeRange: range,
      group_id,
    });
    const countedMessages = await this.messageModel
      .aggregate([
        {
          $match: cond,
        },
        {
          $group:
            /**
             * _id: The id of the group.
             * fieldN: The first field name.
             */
            {
              _id: {
                year: {
                  $year: '$block_timestamp',
                },
                month: {
                  $month: '$block_timestamp',
                },
                day: {
                  $dayOfMonth: '$block_timestamp',
                },
                hour: {
                  $hour: '$block_timestamp',
                },
              },
              count: {
                $sum: 1,
              },
            },
        },
        {
          $set:
            /**
             * field: The field name
             * expression: The expression.
             */
            {
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                  hour: '$_id.hour',
                },
              },
            },
        },
        {
          $sort:
            /**
         * Provid
         e any number of field/order pairs.
         */
            {
              date: 1,
            },
        },
      ])
      .exec();

    return countedMessages.map((c) => ({
      hour: c.date,
      count: c.count,
    }));
  }

  async countAU(group_id: string, range: TimeRange): Promise<number> {
    const cond = makeMessagesFilter({
      timeRange: range,
      group_id,
    });
    
    return await this.messageModel.distinct('profile_id', cond).count();
  }

  async countMessages(group_id: string, range: TimeRange): Promise<number> {
    const cond = makeMessagesFilter({
      timeRange: range,
      group_id,
    });
    const res = await this.messageModel.aggregate([
      {
        $match: cond,
      },
      {
        $group: {
          _id: {
            profile_id: '$profile_id',
          },
        },
      },
      {
        $count:
          /**
           * Provide the field name for the count.
           */
          'count',
      },
    ]);

    if (res.length === 0) {
      return 0;
    }else{
      return res[0].count;
    }
    

  }
}

function makeMessagesFilter({
  timeRange,
  group_id,
  postProcessed = true,
}: {
  timeRange?: TimeRange;
  group_id?: string;
  postProcessed?: boolean;
}) {
  const cond = {};

  if (postProcessed || timeRange) {
    const block_timestamp = {};

    if (postProcessed) {
      Object.assign(block_timestamp, {
        $type: 'date',
      });
      Object.assign(cond, {
        metadata_fetched: true,
      });
    }
    if (timeRange) {
      Object.assign(block_timestamp, {
        $gte: timeRange.start_from,
        $lt: timeRange.end_to,
      });
    }
    Object.assign(cond, {
      block_timestamp,
    });
  }

  if (group_id) {
    Object.assign(cond, {
      app_id: group_id,
    });
  }

  return cond;
}
