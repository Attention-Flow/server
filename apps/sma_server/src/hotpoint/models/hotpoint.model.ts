import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Hotpoint {
  @Field()
  name: string;

  @Field()
  hot: number;

  @Field({
    nullable: true,
  })
  growth?: number;
}

@ObjectType()
export class HotpointsResult {
  @Field(() => [Hotpoint])
  hotpoints: Hotpoint[];

  @Field()
  totalWindows: number;

  @Field()
  unprocessedWindows: number;
}
