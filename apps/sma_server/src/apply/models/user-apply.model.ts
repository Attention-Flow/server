import { Field, ObjectType, createUnionType } from '@nestjs/graphql';
import { ApplyType } from '../enum/apply-type.enum';
import { ApplyStatus } from '../enum/apply-status.enum';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

@ObjectType()
export class NewGroupApply {
  @Field(() => Datasource)
  datasource: Datasource;
  @Field()
  group_id: string;
  @Field()
  name: string;
}

export const ApplyData = createUnionType({
  types: () => [NewGroupApply],
  name: 'ApplyData',
  resolveType: (value) => {
    if ('group_id' in value) {
      return NewGroupApply;
    }
    return undefined;
  },
});
export type ApplyDataType = typeof ApplyData;

@ObjectType()
export class UserApply {
  @Field()
  userId: string;
  @Field()
  id: string;
  @Field(() => ApplyType)
  type: ApplyType;
  @Field(() => ApplyStatus)
  status: ApplyStatus;
  @Field(() => ApplyData)
  data: ApplyDataType;
}
