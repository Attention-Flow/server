import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GroupSubscription } from '../models/group-subscription.model';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UID } from '../../auth/uid.decorator';
import { SubscriptionService } from '../subscription.service';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { SmaGroupsService } from '@app/sma_groups';
import { Subscription } from '../schemas/subscription.schema';
import { GroupActive } from '../../group-active/model/group-active.model';

@Resolver(() => GroupSubscription)
export class GroupSubscriptionsResolver {
  constructor(
    private readonly subsSvc: SubscriptionService,
    private readonly groupsSvc: SmaGroupsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => [GroupSubscription])
  async groupSubscriptions(
    @UID() uid: string,
    @Args('datasource', { type: () => Datasource, nullable: true })
    datasource?: Datasource,
  ) {
    let subs = await this.subsSvc.listUserSubscriptions(uid);
    if (!subs) {

      await this.subsSvc.addUserSubscription(
        uid,
        await this.getDefaultSubscriptions(),
      );
      subs = await this.subsSvc.listUserSubscriptions(uid);
    }
    if (datasource) {
      return subs.groups
        .filter((g) => g.datasource === datasource)
        .map(this.toModel);
    }
    return subs.groups.map(this.toModel);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => GroupSubscription)
  async addGroupSubscription(
    @UID() uid: string,
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('target_id') target_id: string,
  ) {
    await this.subsSvc.addUserSubscription(uid, [
      {
        datasource,
        target_id,
      },
    ]);
    return {
      user_id: uid,
      datasource,
      group_id: target_id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async removeGroupSubscription(
    @UID() uid: string,
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('target_id') target_id: string,
  ) {
    await this.subsSvc.removeUserSubscription(uid, [
      {
        datasource,
        target_id,
      },
    ]);
    return 'ok';
  }

  @ResolveField(() => String)
  async name(@Parent() sub: GroupSubscription) {
    const g = await this.groupsSvc.getGroup(sub.datasource, sub.group_id);
    if (!g) {
      return '';
    }
    return g.name;
  }

  @ResolveField(() => GroupActive)
  active(
    @Parent() sub: GroupSubscription,
    @Args('base', { nullable: true }) base?: Date,
  ): GroupActive {
    return {
      datasource: sub.datasource,
      group_id: sub.group_id,
      base: base ?? new Date(),
    };
  }

  private toModel(sub: Subscription['groups'][0]) {
    return {
      user_id: sub.target_id,
      datasource: sub.datasource,
      group_id: sub.target_id,
    };
  }

  private async getDefaultSubscriptions() {
    const subs = [
      { datasource: Datasource.Telegram, target_id: '1359461894' },
      { datasource: Datasource.Telegram, target_id: '1744945796' },
      { datasource: Datasource.Lens, target_id: 'lenster' },
      { datasource: Datasource.Lens, target_id: 'phaver' },
    ];
    return subs;
  }
}
