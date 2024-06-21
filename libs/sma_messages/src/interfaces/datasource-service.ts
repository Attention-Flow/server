import { TimeRange } from '@app/sma_common/models/time-range.model';
import { MessageDTO } from '../dto/message.dto';

export interface DatasourceService {
  
  queryGroupMessagesTimeRange(group_id: string): Promise<TimeRange>;

  
  listMessagesInRange(
    group_id: string,
    range: TimeRange,
  ): Promise<MessageDTO[]>;

  
  queryMessagesById(ids: string[]): Promise<(MessageDTO | null)[]>;

  
  countMessages(group_id: string, range: TimeRange): Promise<number>;

  
  countMessagesByHours(
    group_id: string,
    range: TimeRange,
  ): Promise<{ hour: Date; count: number }[]>;

  
  countAU(group_id: string, range: TimeRange): Promise<number>;
}
