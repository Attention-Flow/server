import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ collection: 'subscriptions', timestamps: true })
export class Subscription {
  
  @Prop()
  subscriber: string;

  @Prop({
    type: [
      {
        datasource: String,
        target_id: String,
      },
    ],
  })
  groups: {
    datasource: Datasource;
    target_id: string;
  }[];
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
