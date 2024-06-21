import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LensMessageDocument = HydratedDocument<LensMessage>;

@Schema({ collection: 'lens_messages' })
export class LensMessage {
  @Prop()
  post_id: string;

  @Prop()
  profile_id: string;

  @Prop()
  metadata_fetched: boolean;

  @Prop()
  app_id: string;

  @Prop({
    type: {
      content: String,
    },
  })
  metadata: {
    content: string;
  };

  @Prop({ type: Date })
  block_timestamp: Date;
}

export const LensMessageSchema = SchemaFactory.createForClass(LensMessage)
  .index({ block_timestamp: 1 })
  .index({ post_id: 1 }, { unique: true })
  .index({ app_id: 1 })
  .index({ metadata_fetched: 1 });
