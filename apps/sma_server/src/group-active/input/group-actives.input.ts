import { GlobalGroupIdInput } from '@app/sma_groups/inputs/global-group-id.input';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GroupActivesInput {
  @Field(() => [GlobalGroupIdInput])
  groups: GlobalGroupIdInput[];
}
