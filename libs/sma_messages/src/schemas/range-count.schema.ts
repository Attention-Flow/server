import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RangeCountDocument = HydratedDocument<RangeCount>;

@Schema({ collection: 'range_count' })
export class RangeCount {
  @Prop({ required: true, type: String })
  datasource: Datasource;

  @Prop()
  target_id: string;

  @Prop()
  start_from: Date;

  @Prop()
  end_to: Date;

  @Prop()
  type: string;

  @Prop()
  count: number;
}

export const RangeCountSchema = SchemaFactory.createForClass(RangeCount)
  .index({ datasource: 1, target_id: 1 })
  .index({ start_from: 1 })
  .index({ end_to: 1 });
