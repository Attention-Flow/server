import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TimeRange {
  @Field(() => Date)
  start_from: Date;
  @Field(() => Date)
  end_to: Date;
}
