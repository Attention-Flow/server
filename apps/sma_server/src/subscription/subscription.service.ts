import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription } from './schemas/subscription.schema';
import { Model } from 'mongoose';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly userSvc: UserService,
    @InjectModel(Subscription.name)
    private readonly subsModel: Model<Subscription>,
  ) {}

  async listUserSubscriptions(user_id: string) {
    return await this.subsModel.findOne({ subscriber: user_id });
  }

  async addUserSubscription(
    user_id: string,
    group_ids: { datasource: Datasource; target_id: string }[],
  ) {
    const user = await this.userSvc.getUser(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    let subs = await this.subsModel.findOne({ subscriber: user_id });
    if (!subs) {
      subs = new this.subsModel({
        subscriber: user_id,
        groups: group_ids,
      });
      await subs.save();
    } else {
      const groups = [...subs.groups, ...group_ids];
      const unique_groups = [];
      for (const group of groups) {
        const index = unique_groups.findIndex(
          (item) =>
            item.datasource === group.datasource &&
            item.target_id === group.target_id,
        );
        if (index === -1) {
          unique_groups.push(group);
        }
      }
      subs.groups = unique_groups;

      await subs.save();
    }
    return subs;
  }

  async removeUserSubscription(
    user_id: string,
    group_ids: { datasource: Datasource; target_id: string }[],
  ) {
    const user = await this.userSvc.getUser(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const subs = await this.subsModel.findOne({ subscriber: user_id });
    if (!subs) {
      throw new Error('Subscription not found');
    } else {
      subs.groups = subs.groups.filter((group) => {
        return !group_ids.some(
          (group_id) =>
            group_id.datasource === group.datasource &&
            group_id.target_id === group.target_id,
        );
      });
      await subs.save();
    }
  }
  // add user subscription
  // remove user subscription
}

