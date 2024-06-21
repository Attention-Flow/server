import { Field, ObjectType } from '@nestjs/graphql';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

@ObjectType('KeywordSummary')
export class KeywordSummaryModel {
  @Field()
  start_from: Date;
  @Field()
  end_to: Date;

  @Field()
  keyword: string;

  @Field(() => Datasource)
  datasource: Datasource;

  @Field()
  summary: string;
}
