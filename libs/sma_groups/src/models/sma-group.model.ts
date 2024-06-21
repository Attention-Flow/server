import { Field, ObjectType } from '@nestjs/graphql';
import { Datasource } from '../enum/datasource.enum';

@ObjectType()
export class SmaGroup {
  @Field(() => Datasource)
  datasource: Datasource;
  @Field()
  group_id: string;
  @Field()
  name: string;
}
