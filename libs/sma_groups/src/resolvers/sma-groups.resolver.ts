import { Args, Query, Resolver } from '@nestjs/graphql';
import { SmaGroup } from '../models/sma-group.model';
import { Datasource } from '../enum/datasource.enum';
import { SmaGroupsService } from '../sma_groups.service';
import { Group } from '../schemas/target-group.schema';
import { GlobalGroupIdInput } from '../inputs/global-group-id.input';

@Resolver(() => SmaGroup)
export class SmaGroupsResolver {
  constructor(private readonly svc: SmaGroupsService) {}

  @Query(() => SmaGroup)
  async smaGroup(@Args('input') input: GlobalGroupIdInput) {
    const mdl = await this.svc.getGroup(input.datasource, input.group_id);
    return this.toModel(mdl);
  }

  @Query(() => [SmaGroup])
  async smaGroups(
    @Args('input', { type: () => [GlobalGroupIdInput] })
    inputs: GlobalGroupIdInput[],
  ) {
    const mdls = [];
    for (const ggid of inputs) {
      const mdl = await this.svc.getGroup(ggid.datasource, ggid.group_id);
      if (mdl) mdls.push(mdl);
    }
    return mdls.map(this.toModel.bind(this));
    // const mdl = await this.svc.getGroup(input.datasource, input.group_id);
    // return this.toModel(mdl);
  }

  @Query(() => [SmaGroup])
  async searchSmaGroups(
    @Args('keyword') keyword: string,
    @Args('datasource', { nullable: true, type: () => Datasource })
    datasource?: Datasource,
  ) {
    const groups = await this.svc.searchGroups({ keyword, datasource });
    return groups.map(this.toModel);
  }

  toModel(group: Group): SmaGroup {
    return {
      group_id: group.target_id,
      datasource: group.datasource,
      name: group.name,
    };
  }
}
