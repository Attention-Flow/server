import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ApplyDataType,
  UserApply as UserApplyMdl,
} from '../models/user-apply.model';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UID } from '../../auth/uid.decorator';
import { ApplyType } from '../enum/apply-type.enum';
import { ApplyStatus } from '../enum/apply-status.enum';
import { UserApplyService } from '../user-apply.service';
import { UserApply } from '../schemas/user-apply.schema';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

@Resolver(() => UserApplyMdl)
export class UserApplyResolver {
  constructor(private readonly svc: UserApplyService) {}
  @UseGuards(JwtAuthGuard)
  @Query(() => [UserApplyMdl])
  async userApplies(
    @UID() uid: string,
    @Args('type', { nullable: true, type: () => ApplyType }) type?: ApplyType,
    @Args('status', { nullable: true, type: () => ApplyStatus })
    status?: ApplyStatus,
  ) {
    const models = await this.svc.listUserApplys(uid, { type, status });
    return models.map(this.toMdl.bind(this));
  }
  @UseGuards(JwtAuthGuard)
  @Mutation(() => UserApplyMdl)
  async applyNewGroup(
    @UID() uid: string,
    @Args('datasource', { type: () => Datasource }) datasource: Datasource,
    @Args('groupId', { type: () => String }) groupId: string,
    @Args('displayName', { type: () => String }) displayName: string,
  ) {
    const apply = await this.svc.createUserApply(uid, {
      type: ApplyType.NEW_GROUP,
      newGroupData: {
        datasource,
        group_id: groupId,
        name: displayName,
      },
    });
    return this.toMdl(apply);
  }
  private toMdl(apply: UserApply): UserApplyMdl {
    return {
      id: apply.id.toString(),
      userId: apply.userId,
      type: apply.type,
      status: apply.status,
      data: this.toApplyData(apply),
    };
  }
  private toApplyData(apply: UserApply): ApplyDataType {
    switch (apply.type) {
      case ApplyType.NEW_GROUP: {
        return {
          datasource: apply.newGroupData.datasource,
          group_id: apply.newGroupData.group_id,
          name: apply.newGroupData.name,
        };
      }
      default: {
        throw new Error('Unknown apply type');
      }
    }
  }
}
