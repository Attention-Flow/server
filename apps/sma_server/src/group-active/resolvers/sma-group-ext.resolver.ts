import { SmaGroup } from '@app/sma_groups/models/sma-group.model';
import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GroupActive } from '../model/group-active.model';

@Resolver(() => SmaGroup)
export class SmaGroupExtResolver {
  @ResolveField(() => GroupActive)
  async active(@Parent() group: SmaGroup, @Args('base') base: Date) {
    return {
      group_id: group.group_id,
      datasource: group.datasource,
      base,
    };
  }
}
