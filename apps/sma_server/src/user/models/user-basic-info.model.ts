import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserBasicInfo {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field()
  avatarUrl: string;
}
