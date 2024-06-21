import { Field, InputType } from '@nestjs/graphql';
import { Datasource } from '../enum/datasource.enum';

@InputType()
export class GlobalGroupIdInput {
  @Field(() => Datasource)
  datasource: Datasource;
  @Field()
  group_id: string;
}
