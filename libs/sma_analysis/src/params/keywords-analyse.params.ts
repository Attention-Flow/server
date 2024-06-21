import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { GroupContentType } from '@app/sma_groups/enum/group-type.enum';

export interface KeywordsAnalyseParams {
  datasource: Datasource;
  group_id: string;
  group_type: GroupContentType;
  messages: {
    msg_id: string;
    from_id: string;
    message: string;
    date: number;
  }[];
}
