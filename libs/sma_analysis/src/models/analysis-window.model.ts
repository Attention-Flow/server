import { Int, Field, ObjectType } from '@nestjs/graphql';
import { AnalysisWindowStatus } from '../enum/analysis-window-status.enum';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

@ObjectType()
export class AnalysisWindowKeywords {
  @Field()
  name: string;
  @Field(() => Int)
  count: number;
  @Field(() => [String])
  msg_ids: string[];
}

@ObjectType()
export class AnalysisWindow {
  @Field(() => Int)
  duration: number;
  @Field()
  start_from: Date;
  @Field()
  end_to: Date;

  @Field()
  target_id: string;

  @Field(() => Datasource)
  datasource: Datasource;

  @Field(() => AnalysisWindowStatus)
  status: AnalysisWindowStatus;

  @Field(() => Int)
  messages: number;

  @Field(() => [AnalysisWindowKeywords])
  keywords: AnalysisWindowKeywords[];
}
