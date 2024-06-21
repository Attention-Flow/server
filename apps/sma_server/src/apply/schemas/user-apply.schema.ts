import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApplyType } from '../enum/apply-type.enum';
import { ApplyStatus } from '../enum/apply-status.enum';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

export type UserApplyDocument = HydratedDocument<UserApply>;

@Schema({ collection: 'user_applies', timestamps: true })
export class UserApply {
  @Prop()
  userId: string;

  @Prop({ default: () => new Types.ObjectId() })
  id: Types.ObjectId;

  @Prop({ type: String, enum: ApplyType })
  type: ApplyType;

  @Prop({ type: String, enum: ApplyStatus, default: ApplyStatus.PENDING })
  status: ApplyStatus;

  @Prop({
    type: {
      datasource: {
        type: String,
        enum: Datasource,
      },
      group_id: String,
      name: String,
    },
    required: false,
  })
  newGroupData: {
    datasource: Datasource;
    group_id: string;
    name: string;
  };
}

export const UserApplySchema = SchemaFactory.createForClass(UserApply)
  .index({
    user_id: 1,
  })
  .index({ status: 1 });
