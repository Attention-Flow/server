import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GroupActive } from '../model/group-active.model';
import { GroupActiveService } from '../group-active.service';
import { SmaMessagesService } from '@app/sma_messages';
import {
  prevNthUtcDayRange,
  prevUtcDaysRange,
  todayUtcDayRange,
} from '@app/sma_common/utils';
import { GroupActivesInput } from '../input/group-actives.input';

@Resolver(() => GroupActive)
export class GroupActiveResolver {
  constructor(
    private readonly groupActiveSvc: GroupActiveService,
    private readonly smaMsgSvc: SmaMessagesService,
  ) {}

  // @Query(() => [GroupActive])
  // async groupActives(@Args('input') input: GroupActivesInput) {
  //   return input.groups;
  // }

  @ResolveField(() => Int)
  async level(@Parent() groupActive: GroupActive) {
    return await this.groupActiveSvc.calcGroupActiveLevel(
      groupActive.datasource,
      groupActive.group_id,
      groupActive.base,
    );
  }


  @ResolveField(() => Int)
  async todayMsgs(@Parent() groupActive: GroupActive) {
    return await this.smaMsgSvc
      .getDatasourceImpl(groupActive.datasource)
      .countMessages(groupActive.group_id, todayUtcDayRange(groupActive.base));
  }

  @ResolveField(() => Int)
  async weekMsgs(@Parent() groupActive: GroupActive) {
    return await this.smaMsgSvc
      .getDatasourceImpl(groupActive.datasource)
      .countMessages(
        groupActive.group_id,
        prevUtcDaysRange(7, groupActive.base),
      );
  }

  @ResolveField(() => Int)
  async monthMsgs(@Parent() groupActive: GroupActive) {
    return await this.smaMsgSvc
      .getDatasourceImpl(groupActive.datasource)
      .countMessages(
        groupActive.group_id,
        prevUtcDaysRange(30, groupActive.base),
      );
  }

  @ResolveField(() => [Int])
  async dayMsgsHistory(
    @Parent() groupActive: GroupActive,
    @Args('days') days: number,
  ) {
    const messages: number[] = [];
    const svc = this.smaMsgSvc.getDatasourceImpl(groupActive.datasource);
    for (let prev = 0; prev < days; prev++) {
      const msgs = await svc.countMessages(
        groupActive.group_id,
        prevNthUtcDayRange(prev, groupActive.base),
      );
      messages.unshift(msgs);
    }
    return messages;
  }


  @ResolveField(() => Int)
  async dau(@Parent() groupActive: GroupActive) {
    return await this.smaMsgSvc
      .getDatasourceImpl(groupActive.datasource)
      .countAU(groupActive.group_id, todayUtcDayRange(groupActive.base));
  }

  @ResolveField(() => Int)
  async wau(@Parent() groupActive: GroupActive) {
    return await this.smaMsgSvc
      .getDatasourceImpl(groupActive.datasource)
      .countAU(groupActive.group_id, prevUtcDaysRange(7, groupActive.base));
  }

  @ResolveField(() => Int)
  async mau(@Parent() groupActive: GroupActive) {
    return await this.smaMsgSvc
      .getDatasourceImpl(groupActive.datasource)
      .countAU(groupActive.group_id, prevUtcDaysRange(30, groupActive.base));
  }

  @ResolveField(() => [Int])
  async dauHistory(
    @Parent() groupActive: GroupActive,
    @Args('days') days: number,
  ) {
    const daus: number[] = [];
    const svc = this.smaMsgSvc.getDatasourceImpl(groupActive.datasource);
    for (let prev = 0; prev < days; prev++) {
      const dau = await svc.countAU(
        groupActive.group_id,
        prevNthUtcDayRange(prev, groupActive.base),
      );
      daus.unshift(dau);
    }
    return daus;
  }
}
