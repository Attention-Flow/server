import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GroupSubscription {
  @Field()
  user_id: string;

  @Field(() => Datasource)
  datasource: Datasource;

  @Field()
  group_id: string;
}
