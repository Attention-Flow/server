import { Injectable, Logger } from '@nestjs/common';
import { DatasourceService } from '../interfaces/datasource-service';
import { InjectModel } from '@nestjs/mongoose';
import { TelegramMessage } from '../schemas/telegram-message.schema';
import { Model } from 'mongoose';
import { MessageDTO } from '../dto/message.dto';
import { TimeRange } from '@app/sma_common/models/time-range.model';
import { RangeCount } from '../schemas/range-count.schema';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

@Injectable()
export class TelegramDatasourceService implements DatasourceService {
  private readonly logger = new Logger(TelegramDatasourceService.name);

  constructor(
    @InjectModel(TelegramMessage.name)
    private readonly messageModel: Model<TelegramMessage>,

    @InjectModel(RangeCount.name)
    private readonly rangeCountModel: Model<RangeCount>,
  ) {}

  async queryGroupMessagesTimeRange(group_id: string): Promise<TimeRange> {
    const conditions = makeMessagesFilter({
      group_id,
    });

    const latest = await this.messageModel
      .findOne(conditions)
      .sort({
        date: -1,
      })
      .exec();
    const earliest = await this.messageModel
      .findOne(conditions)
      .sort({
        date: 1,
      })
      .exec();

    if (!earliest || !latest) {
      return {
        start_from: new Date(0),
        end_to: new Date(0),
      };
    }

    return {
      start_from: earliest.date,
      end_to: latest.date,
    };
  }

  async listMessagesInRange(
    group_id: string,
    range: TimeRange,
  ): Promise<MessageDTO[]> {
    const cond = makeMessagesFilter({
      group_id,
      timeRange: range,
    });

    // console.log(cond);
    const msgs = await this.messageModel
      .find(cond, {
        _id: 0,
        id: 1,
        date: 1,
        message: 1,
        from_id: 1,
        peer_id: 1,
      })
      .sort({ date: 1 })
      .exec();

    // console.log(msgs);

    return msgs.map((msg) => {
      return this.toMsg(msg);
    });
  }
  async queryMessagesById(ids: string[]): Promise<MessageDTO[]> {
    const msgFilters = ids.map((id) => this.fromDatasourceGlobalMsgId(id));

    // group_by channel_id
    const msgFiltersByChannel = new Map<number, number[]>();
    msgFilters.forEach((filter) => {
      const channel_id = filter.channel_id;
      if (!msgFiltersByChannel.has(channel_id)) {
        msgFiltersByChannel.set(channel_id, []);
      }
      msgFiltersByChannel.get(channel_id).push(filter.msg_id);
    });

    // query

    let msgs = [];

    for (const [channel_id, msg_ids] of msgFiltersByChannel.entries()) {
      const findParams = {
        'peer_id.channel_id': channel_id,
        id: {
          $in: msg_ids,
        },
      };

      this.logger.debug(JSON.stringify(findParams));
      const partMsgs = await this.messageModel.find(findParams);
      msgs = msgs.concat(partMsgs);
      this.logger.debug(`found ${partMsgs.length} msgs`);
    }

    // const findParams = {
    //   $or: Array.from(msgFiltersByChannel.entries()).map(
    //     ([channel_id, msg_ids]) => {
    //       return {
    //         'peer_id.channel_id': channel_id,
    //         id: {
    //           $in: msg_ids,
    //         },
    //       };
    //     },
    //   ),
    // };
    // // this.logger.debug(JSON.stringify(findParams));
    // const msgs = await this.messageModel.find(findParams);
    this.logger.debug(`total ${msgs.length} msgs`);
    const globalIdMsgMaps = new Map<string, MessageDTO>();

    msgs.forEach((msg) => {
      const dto = this.toMsg(msg);

      globalIdMsgMaps.set(dto.msg_id, this.toMsg(msg));
    });
    this.logger.debug(Array.from(globalIdMsgMaps.keys()).slice(0, 2));

    return ids.map((id) => globalIdMsgMaps.get(id) || null);
  }

  toMsg(msg: TelegramMessage) {
    return {
      msg_id: this.toDatasourceGlobalMsgId(msg),
      group_id: msg.peer_id.channel_id.toString(),
      from_id: getFromId(msg),
      message: msg.message,
      date: Math.ceil(msg.date.getTime() / 1000),
    };
  }

  toDatasourceGlobalMsgId(doc: TelegramMessage) {
    // console.log(doc);
    return `${doc.peer_id.channel_id}::${doc.id}`;
  }

  fromDatasourceGlobalMsgId(id: string) {
    const [channel_id, msg_id] = id.split('::');
    return {
      channel_id: parseInt(channel_id),
      msg_id: parseInt(msg_id),
    };
  }

  async countMessagesByHours(
    group_id: string,
    range: TimeRange,
  ): Promise<{ hour: Date; count: number }[]> {
    const cond = makeMessagesFilter({
      group_id,
      timeRange: range,
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
                  $year: '$date',
                },
                month: {
                  $month: '$date',
                },
                day: {
                  $dayOfMonth: '$date',
                },
                hour: {
                  $hour: '$date',
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
      group_id,
      timeRange: range,
    });

    const countObj = await this.rangeCountModel.findOne({
      datasource: Datasource.Telegram,
      target_id: group_id,
      start_from: range.start_from,
      end_to: range.end_to,
      type: 'au',
    });

    if (countObj) {
      return countObj.count;
    }

    const ret = await this.messageModel
      .aggregate()
      .match(cond)
      .project({
        uid: '$from_id.user_id',
      })
      .group({
        _id: '$uid',
      })
      .group({
        _id: null,
        count: {
          $sum: 1,
        },
      })
      .exec();

    const count = ret[0].count;
    // .distinct('from_id.user_id', cond)
    // .count();
    if (range.end_to.getTime() < new Date().getTime()) {
      this.logger.debug(
        `save au count ${count} for ${Datasource.Telegram} ${group_id} ${range.start_from}-${range.end_to}`,
      );
      await this.rangeCountModel.create({
        datasource: Datasource.Telegram,
        target_id: group_id,
        start_from: range.start_from,
        end_to: range.end_to,
        type: 'au',
        count,
      });
    }

    return count;
  }

  async countMessages(group_id: string, range: TimeRange): Promise<number> {
    const cond = makeMessagesFilter({
      group_id,
      timeRange: range,
    });

    const countObj = await this.rangeCountModel.findOne({
      datasource: Datasource.Telegram,
      target_id: group_id,
      start_from: range.start_from,
      end_to: range.end_to,
      type: 'msgs',
    });
    if (countObj) {
      return countObj.count;
    }

    const count = await this.messageModel.count(cond);

    if (range.end_to.getTime() < new Date().getTime()) {
      this.logger.debug(
        `save msgs count ${count} for ${Datasource.Telegram} ${group_id} ${range.start_from}-${range.end_to}`,
      );
      await this.rangeCountModel.create({
        datasource: Datasource.Telegram,
        target_id: group_id,
        start_from: range.start_from,
        end_to: range.end_to,
        type: 'msgs',
        count,
      });
    }

    return count;
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
  const cond = {
    _: 'Message',
  };
  if (postProcessed || timeRange) {
    const date = {};
    if (postProcessed) {
      Object.assign(date, {
        $type: 'date',
      });
    }
    if (timeRange) {
      Object.assign(date, {
        $gte: timeRange.start_from,
        $lt: timeRange.end_to,
      });
    }
    Object.assign(cond, {
      date,
    });
  }
  if (group_id) {
    Object.assign(cond, {
      'peer_id.channel_id': parseInt(group_id),
    });
  }

  return cond;
}

function getFromId(msg: TelegramMessage): string {
  if (!msg.from_id) {
    return '';
  }

  switch (msg.from_id._) {
    case 'PeerUser':
      return msg.from_id.user_id.toString();
    case 'PeerChannel':
      return msg.from_id.channel_id.toString();
    default:
      throw new Error(`Unknown from_id._: ${msg.from_id._}`);
  }
}
