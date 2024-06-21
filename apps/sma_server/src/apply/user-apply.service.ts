import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserApply } from './schemas/user-apply.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ApplyType } from './enum/apply-type.enum';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { SmaGroupsService } from '@app/sma_groups';
import { ApplyStatus } from './enum/apply-status.enum';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class UserApplyService {
  private readonly logger = new Logger(UserApplyService.name);

  constructor(
    @InjectModel(UserApply.name)
    private readonly userApplyModel: Model<UserApply>,

    private readonly smaGroupsSvc: SmaGroupsService,
    private readonly subscriptionSvc: SubscriptionService,
  ) {}

  async createUserApply(
    user_id: string,
    data: {
      type: ApplyType.NEW_GROUP;
      newGroupData: {
        datasource: Datasource;
        group_id: string;
        name: string;
      };
    },
  ) {

    const exists = await this.smaGroupsSvc.getGroup(
      data.newGroupData.datasource,
      data.newGroupData.group_id,
    );
    if (exists) {
      throw new Error('group already exists');
    }

    const existsApply = await this.userApplyModel.findOne({
      userId: user_id,
      type: data.type,
      'newGroupData.datasource': data.newGroupData.datasource,
      'newGroupData.group_id': data.newGroupData.group_id,
    });
    if (existsApply) {
      throw new Error('apply already exists');
    }

    const mdl = await this.userApplyModel.create({
      userId: user_id,
      type: data.type,
      newGroupData: data.newGroupData,
    });
    return await mdl.save();
  }

  async listUserApplys(
    user_id: string,
    options: {
      type?: ApplyType;
      status?: ApplyStatus;
    } = {},
  ) {
    return await this.userApplyModel.find({
      userId: user_id,
      ...options,
    });
  }

  async finishUserApply(
    apply_id: string,
    status: ApplyStatus.FINISHED | ApplyStatus.REJECTED,
  ) {
    const apply = await this.userApplyModel.findOne({
      id: apply_id,
    });
    if (!apply) {
      throw new Error('apply not found');
    }
    if (apply.status !== ApplyStatus.PENDING) {
      throw new Error('apply already finished or rejected');
    }

    switch (apply.type) {
      case ApplyType.NEW_GROUP: {
        switch (status) {
          case ApplyStatus.FINISHED: {
            await this.subscriptionSvc.addUserSubscription(apply.userId, [
              {
                datasource: apply.newGroupData.datasource,
                target_id: apply.newGroupData.group_id,
              },
            ]);
            apply.status = ApplyStatus.FINISHED;
            return await apply.save();
          }
          case ApplyStatus.REJECTED: {
            apply.status = ApplyStatus.REJECTED;
            return await apply.save();
          }
          default: {
            throw new Error(`cannot update apply status to '${status}'`);
          }
        }
      }
      default: {
        throw new Error('unknown apply type');
      }
    }
  }
}
