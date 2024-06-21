import { lastUtcDayRange } from '@app/sma_common/utils';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { SmaMessagesService } from '@app/sma_messages';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupActiveService {

  private GROUP_LEVEL_MESSAGE_COUNT = [0, 100, 200, 400, 800];

  constructor(private readonly smaMsgSvc: SmaMessagesService) {}

  async calcGroupActiveLevel(
    datasource: Datasource,
    group_id: string,
    base?: Date,
  ): Promise<number> {
    const svc = this.smaMsgSvc.getDatasourceImpl(datasource);
    const messages = await svc.countMessages(group_id, lastUtcDayRange(base));
    return judgeLevel(this.GROUP_LEVEL_MESSAGE_COUNT, messages);
  }
}

function judgeLevel(levels: number[], value: number): number {
  let level = 0;
  for (const levelValue of levels) {
    if (value >= levelValue) {
      level++;
    }
  }
  return level;
}
