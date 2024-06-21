import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class HistoricalMetric {
  @Field()
  start_from: Date;
  @Field()
  end_to: Date;
  @Field()
  metric: number;
}
