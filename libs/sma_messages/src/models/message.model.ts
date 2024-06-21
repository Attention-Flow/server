import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Message {
  @Field()
  msg_id: string;
  @Field()
  from_id: string;
  @Field()
  group_id: string;
  @Field()
  message: string;
  @Field()
  date: Date;
}
